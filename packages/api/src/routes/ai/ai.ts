import { TEXT_MODEL } from "@/ai/constants.ts";
import {
  transformMarkdown,
  type Destination,
  type DestinationMode,
  type RichTextStreamEvent,
} from "@/utils/markdown.ts";
import { openai } from "@/ai/openai.ts";
import { generateImageFromPrompt, createImageTile } from "@/ai/tools/images.ts";
import { TOOLS, useFunctionTool } from "@/ai/tools/tools.ts";
import { fetchTilesForContext } from "@/ai/context/tiles.ts";
import { buildContextIds, formatTileContext } from "@/ai/context/format.ts";
import type { GenerateImageSchema, WriteSchema } from "./schema.ts";
import type {
  Action,
  ActionEvent,
  Artifact,
  ToolContext,
} from "@/ai/tools/types.ts";
import type {
  ResponseInput,
  ResponseInputItem,
  ResponseOutputItem,
  ResponseStreamEvent,
} from "openai/resources/responses/responses";
import type { AuthenticatedPageProcedureContext } from "@/utils/middleware.ts";

interface ResolvedDestination {
  destination: string | null;
  mode?: DestinationMode;
}

export interface Message {
  message: string;
}

export type WriteEvent =
  | Exclude<RichTextStreamEvent, Destination>
  | ResolvedDestination
  | Artifact
  | ActionEvent
  | Message;

const MAX_TURNS = 12;
const PROMPT = `You are a tool for creating and editing interactive documents. Use tool calls and block markers to create and edit document content. Any text outside of block markers will be shown as a message to the user in a chat interface (not inserted into the document). You may include a brief conversational response when appropriate, especially to acknowledge the user's request, explain what you did, or ask clarifying questions.

- The document is laid out as blocks with varying sizes.
- Large blocks span the whole document, while other blocks may appear side-by-side.
- Blocks will be inserted into the document in the order they are created.
- Supported block types: text, image, map, table, chart, link, section

# Creating Content

Use any available tools as appropriate. You do not need to ask permission first.

## Text

Use the "create_text" tool to create text blocks. To provide content for a text block, use this syntax in your response:

>>> id
...content...
<<<

where "id" is the value returned by the tool. Use Markdown for formatting (bold, italics, headings, lists). Example:

>>> 0
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

## Maps

Use "create_map" to create an interactive map with a style (DEFAULT, SATELLITE, WATERCOLOR, or MONOCHROME). After creating a map, pass its ID as the "sectionId" parameter to other tools and provide "coordinates" (lat/long) to place content as pins on the map. Use real-world geographic coordinates for locations. Use "edit_style" with "coordinates" to reposition existing tiles or to place generated images on the map.

# Editing Existing Text

When content is referenced (shown with IDs like "0", "1"), you can edit text tiles directly using marker syntax. Do NOT call "create_text" for editing - just use the marker with the referenced ID:

>>>= 0
...new content (replaces existing)...
<<<

>>>+ 0
...content appended to end...
<<<

>>>^ 0
...content prepended to start...
<<<

Choose the appropriate mode based on the user's request:
- "make this shorter", "rewrite this" → replace (>>>=)
- "add more details", "continue" → append (>>>+)
- "add an introduction" → prepend (>>>^)

# Deleting Content

Use "delete_tiles" to remove one or more tiles from the document when the user asks to delete or remove content.

# Styling

Use the "edit_style" tool to style any block after creating it. Unless directed, style blocks to make the document engaging and colorful. You may use emojis in text content.
`;

export async function generateImage({ prompt }: GenerateImageSchema) {
  return generateImageFromPrompt(prompt);
}

export async function* write(
  { pageId, sectionId, prompt, context, history }: WriteSchema,
  ctx: AuthenticatedPageProcedureContext,
  signal?: AbortSignal,
): AsyncIterable<WriteEvent> {
  const input: ResponseInput = [{ role: "developer", content: PROMPT }];

  if (context?.text) {
    input.push({ role: "user", content: context.text });
  }

  const tiles = context?.tileIds?.length
    ? await fetchTilesForContext(context.tileIds, pageId)
    : [];
  const artifactIds = buildContextIds(tiles);

  const tileContext = formatTileContext(tiles);
  if (tileContext) {
    input.push({ role: "user", content: tileContext });
  }

  if (history?.length) {
    for (const message of history) {
      input.push({ role: message.role, content: message.content });
    }
  }

  input.push({ role: "user", content: prompt });

  const toolContext: ToolContext = {
    ...ctx,
    pageId,
    sectionId,
    model: TEXT_MODEL,
    resolveArtifactId: (id: number) => {
      const artifactId = artifactIds[id];
      if (!artifactId) {
        throw new Error(`Unknown artifact: ${id}`);
      }
      return artifactId;
    },
  };

  let turn = 0;
  let continueTurns = true;

  // oxlint-disable-next-line no-unmodified-loop-condition
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
  artifactIds: string[],
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
  const actions: Action[] = [];

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

              if (!result) {
                toolCalls.push({
                  type: "function_call_output",
                  call_id: item.call_id,
                  output: JSON.stringify({ status: "ok" }),
                });
                return;
              }

              if ("actions" in result) {
                actions.push(...result.actions);
                toolCalls.push({
                  type: "function_call_output",
                  call_id: item.call_id,
                  output: JSON.stringify({ status: "ok" }),
                });
                return;
              }

              const id = String(artifactIds.length);
              artifactIds.push(result.artifact.id);
              toolCalls.push({
                type: "function_call_output",
                call_id: item.call_id,
                output: JSON.stringify({ id }),
              });
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
    let destination: string | null = null;

    for await (const textEvent of text) {
      if (typeof textEvent === "object" && "destination" in textEvent) {
        destination =
          textEvent.destination !== null
            ? toolContext.resolveArtifactId(textEvent.destination)
            : null;
        if (destination) {
          yield { destination, mode: textEvent.mode };
        }
      } else if (destination) {
        yield textEvent;
      } else if (typeof textEvent === "string") {
        yield { message: textEvent };
      }
    }
    for (const artifact of artifacts) {
      yield artifact;
    }
    for (const action of actions) {
      yield { action };
    }
  }

  return {
    events,
    output,
    toolCalls,
  };
}
