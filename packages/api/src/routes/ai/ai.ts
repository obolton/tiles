import { TEXT_MODEL } from "@/ai/constants.ts";
import {
  transformMarkdown,
  type RichTextStreamEvent,
} from "@/utils/markdown.ts";
import { openai, textStream } from "@/ai/openai.ts";
import { generateImageFromPrompt, createImageTile } from "@/ai/images.ts";
import { TOOLS, callFunction, type Artifact } from "@/ai/tools.ts";
import type { GenerateImageSchema, WriteSchema } from "./schema.ts";
import type {
  ResponseInput,
  ResponseStreamEvent,
} from "openai/resources/responses/responses";
import type { AuthenticatedRequestContext } from "@/utils/trpc.ts";

export async function generateImage({ prompt }: GenerateImageSchema) {
  return generateImageFromPrompt(prompt);
}

export async function* write(
  { pageId, sectionId, prompt, context }: WriteSchema,
  { userId }: AuthenticatedRequestContext,
  signal?: AbortSignal,
): AsyncIterable<RichTextStreamEvent | Artifact> {
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
    userId,
    pageId,
    sectionId,
    model: TEXT_MODEL,
  };

  const artifacts = b.pipeThrough(
    new TransformStream<ResponseStreamEvent, Artifact>({
      async transform(event, controller) {
        if (event.type !== "response.output_item.done") {
          return;
        }

        const { item } = event;

        if (item.type === "function_call" && item.status === "completed") {
          const artifact = await callFunction(item, toolContext);
          controller.enqueue(artifact);
          return;
        }

        if (
          item.type === "image_generation_call" &&
          item.status === "completed" &&
          item.result
        ) {
          const artifact = await createImageTile(item, toolContext);
          controller.enqueue(artifact);
          return;
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
