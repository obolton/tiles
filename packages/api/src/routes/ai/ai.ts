import { TEXT_TO_IMAGE_MODEL, TEXT_MODEL } from "./constants.ts";
import {
  transformMarkdown,
  type RichTextStreamEvent,
} from "@/utils/markdown.ts";
import { openai, textStream } from "@/ai/openai.ts";
import { TOOLS, callFunction, type FunctionCallResult } from "@/ai/tools.ts";
import type { GenerateImageSchema, WriteSchema } from "./schema.ts";
import type {
  ResponseInput,
  ResponseStreamEvent,
} from "openai/resources/responses/responses";

export async function generateImage({ prompt }: GenerateImageSchema) {
  const response = await openai.images.generate({
    model: TEXT_TO_IMAGE_MODEL,
    output_format: "webp",
    prompt,
  });

  if (!response.data) {
    throw new Error("Invalid response");
  }

  const [output] = response.data;
  const data = output?.b64_json;

  return {
    type: "image/webp",
    data,
  };
}

export async function* write(
  { pageId, sectionId, prompt, context }: WriteSchema,
  signal?: AbortSignal,
): AsyncIterable<RichTextStreamEvent | FunctionCallResult> {
  const input: ResponseInput = [
    {
      role: "developer",
      content:
        "You are a tool for creating interactive documents. Use any available tools as appropriate, you do not need to ask permission first.",
    },
  ];
  if (context) {
    input.push({ role: "user", content: context });
  }
  input.push({ role: "user", content: prompt });

  const response = await openai.responses.create(
    {
      model: TEXT_MODEL,
      input,
      reasoning: { effort: "medium" },
      tools: TOOLS,
      stream: true,
    },
    { signal },
  );
  const stream = ReadableStream.from(response);
  const [a, b] = stream.tee();

  const text = a.pipeThrough(textStream()).pipeThrough(transformMarkdown());

  const toolContext = {
    pageId,
    sectionId,
    model: TEXT_MODEL,
  };

  const artifacts = b.pipeThrough(
    new TransformStream<ResponseStreamEvent, FunctionCallResult>({
      async transform(event, controller) {
        if (
          event.type === "response.output_item.done" &&
          event.item.type === "function_call" &&
          event.item.status === "completed"
        ) {
          const artifact = await callFunction(event.item, toolContext);
          controller.enqueue(artifact);
        }
      },
    }),
  );

  for await (const textEvent of text) {
    yield textEvent;
  }

  for await (const artifactEvent of artifacts) {
    yield artifactEvent;
  }
}
