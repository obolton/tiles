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

const MAX_TURNS = 12;
const PROMPT = `You are a tool for creating interactive documents. Provide direct responses, be succinct, do not include preludes or questions. Use Markdown to format text (with support for bold, italics, headings, lists).

- The document is laid out as blocks with varying sizes.
- Large blocks span the whole document, while other blocks may appear side-by-side.
- Blocks will be inserted into the document in the order they are created.
- Supported block types: text, image, map

# Tool usage

Use any available tools as appropriate. You do not need to ask permission first.

## Text

To indicate content for a text section that was generated with the "create_text" tool (only), use this syntax in your response:

>>> id
...content...
<<<

where "id" is the value of the "id" property returned by the tool. You may use Markdown. For example:

>>> text-1
# Heading

Some **text**

- List item 1
- List item 2
<<<

## Images

Generated images will be inserted as image blocks.

# Styling

Unless directed, use the styling options available with the tools to make the document engaging and colorful as appropriate from the input. You may use emojis.
`;

export async function generateImage({ prompt }: GenerateImageSchema) {
  return generateImageFromPrompt(prompt);
}

export async function* write(
  { pageId, sectionId, prompt, context }: WriteSchema,
  { userId }: AuthenticatedRequestContext,
  signal?: AbortSignal,
): AsyncIterable<RichTextStreamEvent | Artifact> {
  const input: ResponseInput = [{ role: "developer", content: PROMPT }];
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
  const artifactIds = new Map<string, string>();

  while (continueTurns && turn < MAX_TURNS && !signal?.aborted) {
    const { events, output, toolCalls } = await streamTurn(
      input,
      toolContext,
      artifactIds,
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
  artifactIds: Map<string, string>,
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
          const result = await useFunctionTool(item, toolContext);
          const id =
            result.artifact.type.toLowerCase() + "-" + event.output_index;
          toolCalls.push({
            type: "function_call_output",
            call_id: item.call_id,
            output: JSON.stringify({ id }),
          });
          artifactIds.set(id, result.artifact.id);
          controller.enqueue(result);
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
    for await (const textEvent of text) {
      // Map artifact IDs back to entity IDs
      if (typeof textEvent === "object" && "destination" in textEvent) {
        const destination = textEvent.destination
          ? (artifactIds.get(textEvent.destination) ?? null)
          : null;
        yield { destination };
      } else {
        yield textEvent;
      }
    }
    for await (const toolEvent of tools) {
      yield toolEvent;
    }
  }

  return {
    events,
    output,
    toolCalls,
  };
}
