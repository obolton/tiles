import { TEXT_MODEL } from "@/ai/constants.ts";
import {
  transformMarkdown,
  type RichTextStreamEvent,
} from "@/utils/markdown.ts";
import { openai, textStream } from "@/ai/openai.ts";
import { generateImageFromPrompt, createImageTile } from "@/ai/tools/images.ts";
import { TOOLS, useFunctionTool } from "@/ai/tools/tools.ts";
import type { ToolContext } from "@/ai/tools/types.ts";
import type { Artifact } from "@/ai/tools/types.ts";
import type { GenerateImageSchema, WriteSchema } from "./schema.ts";
import type {
  ResponseInput,
  ResponseInputItem,
  ResponseOutputItem,
  ResponseStreamEvent,
} from "openai/resources/responses/responses";
import type { AuthenticatedRequestContext } from "@/utils/trpc.ts";

const MAX_TURNS = 5;

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

  const toolContext: ToolContext = {
    userId,
    pageId,
    sectionId,
    model: TEXT_MODEL,
  };

  let turn = 0;
  let continueTurns = true;

  while (continueTurns && turn < MAX_TURNS && !signal?.aborted) {
    const { events, output, toolCalls } = await streamTurn(
      input,
      toolContext,
      signal,
    );
    yield* events();
    input.push(...output, ...toolCalls);
    turn++;
    continueTurns = toolCalls.length > 0;
  }
}

export async function streamTurn(
  input: ResponseInput,
  toolContext: ToolContext,
  signal?: AbortSignal,
) {
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

  const output: ResponseOutputItem[] = [];
  const toolCalls: ResponseInputItem.FunctionCallOutput[] = [];

  const tools = b.pipeThrough(
    new TransformStream<ResponseStreamEvent, Artifact>({
      async transform(event, controller) {
        if (event.type !== "response.output_item.done") {
          return;
        }

        const { item } = event;

        output.push(item);

        if (item.type === "function_call" && item.status === "completed") {
          const artifact = await useFunctionTool(item, toolContext);
          toolCalls.push({
            type: "function_call_output",
            call_id: item.call_id,
            output: JSON.stringify({ ok: true }),
          });
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

  async function* events() {
    for await (const toolEvent of tools) {
      yield toolEvent;
    }
    for await (const textEvent of text) {
      yield textEvent;
    }
  }

  return {
    events,
    output,
    toolCalls,
  };
}
