import { TEXT_MODEL } from "@/ai/constants.ts";
import {
  transformMarkdown,
  type RichTextStreamEvent,
} from "@/utils/markdown.ts";
import { openai } from "@/ai/openai.ts";
import { generateImageFromPrompt, createImageTile } from "@/ai/tools/images.ts";
import { TOOLS, useFunctionTool } from "@/ai/tools/tools.ts";
import { fetchTilesForContext } from "@/ai/context/tiles.ts";
import { formatTileContext } from "@/ai/context/format.ts";
import type { ToolContext } from "@/ai/tools/types.ts";
import type { Artifact } from "@/ai/tools/types.ts";
import type { GenerateImageSchema, WriteSchema } from "./schema.ts";
import type {
  ResponseInput,
  ResponseInputItem,
  ResponseOutputItem,
  ResponseStreamEvent,
} from "openai/resources/responses/responses";
import type { AuthenticatedPageProcedureContext } from "@/utils/middleware.ts";

const MAX_TURNS = 12;
const PROMPT = `You are a tool for creating interactive documents. Provide direct responses, be succinct, do not include preludes or questions.

- The document is laid out as blocks with varying sizes.
- Large blocks span the whole document, while other blocks may appear side-by-side.
- Blocks will be inserted into the document in the order they are created.
- Supported block types: text, image, map, table, chart, link, section

# Tool usage

Use any available tools as appropriate. You do not need to ask permission first.

## Text

Use the "create_text" tool to create text blocks. To provide content for a text block, use this syntax in your response:

>>> id
...content...
<<<

where "id" is the value returned by the tool. Use Markdown for formatting (bold, italics, headings, lists). Example:

>>> text-0
# Heading

Some **text**

- List item 1
- List item 2
<<<

## Images

Generated images will be inserted as image blocks.

## Tables and Charts

Use "create_table" to create structured data tables. Use "create_chart" to visualize table data - you must create a table first, then reference its ID when creating the chart.

## Links

Use "create_link" to create link cards for URLs.

## Sections

Use "create_section" to create a container for grouping related content. After creating a section, pass its ID as the "sectionId" parameter to other tools to place content inside it.

# Styling

Unless directed, use the styling options available with the tools to make the document engaging and colorful as appropriate from the input. You may use emojis.

## Available styling options

- **Background**: Solid colors or gradients (vertical, horizontal, diagonal directions)
- **Animation**: Entrance effects (FADE, SLIDE, GROW, SHRINK) for visual impact
- **Frame**: Visual frame styles for blocks - OUTLINED (thin border), SUBTLE (soft glow), CARD (paper shadow), RAISED (floating shadow), FRAMED (bold border)
- **Dock**: Attach blocks to viewport edges (TOP, BOTTOM, LEFT, RIGHT) to stay fixed while scrolling
- **Hide**: Make blocks visible only in edit mode (useful for presenter notes)
- **Position**: For FREEFORM sections, position blocks using x/y percentages (0-100)
`;

export async function generateImage({ prompt }: GenerateImageSchema) {
  return generateImageFromPrompt(prompt);
}

export async function* write(
  { pageId, sectionId, prompt, context }: WriteSchema,
  { userId, workspaceId }: AuthenticatedPageProcedureContext,
  signal?: AbortSignal,
): AsyncIterable<RichTextStreamEvent | Artifact> {
  const input: ResponseInput = [{ role: "developer", content: PROMPT }];

  if (context?.text) {
    input.push({ role: "user", content: context.text });
  }

  if (context?.tileIds && context.tileIds.length > 0) {
    const tiles = await fetchTilesForContext(context.tileIds, pageId);
    const tileContext = formatTileContext(tiles);
    if (tileContext) {
      input.push({ role: "user", content: tileContext });
    }
  }

  input.push({ role: "user", content: prompt });

  const toolContext: ToolContext = {
    userId,
    workspaceId,
    pageId,
    sectionId,
    model: TEXT_MODEL,
    resolveArtifactId: (id: string) => {
      const artifactId = artifactIds.get(id);
      if (!artifactId) {
        throw new Error(`Unknown artifact: ${id}`);
      }
      return artifactId;
    },
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

  const output: ResponseOutputItem[] = [];
  const toolCalls: ResponseInputItem.FunctionCallOutput[] = [];
  const artifacts: Artifact[] = [];

  const text = ReadableStream.from(response)
    .pipeThrough(
      new TransformStream<ResponseStreamEvent, string>({
        async transform(event, controller) {
          if (event.type === "response.output_text.delta") {
            controller.enqueue(event.delta);
            return;
          }

          if (event.type === "response.output_item.done") {
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
              artifacts.push(result);
              return;
            }

            if (
              item.type === "image_generation_call" &&
              item.status === "completed" &&
              item.result
            ) {
              const artifact = await createImageTile(item, toolContext);
              artifacts.push(artifact);
            }
          }
        },
      }),
    )
    .pipeThrough(transformMarkdown());

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
    for (const artifact of artifacts) {
      yield artifact;
    }
  }

  return {
    events,
    output,
    toolCalls,
  };
}
