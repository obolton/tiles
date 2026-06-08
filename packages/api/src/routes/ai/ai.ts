import { TEXT_MODEL } from "@/ai/constants";
import {
  transformMarkdown,
  type RichTextFormat,
  type RichTextNode,
} from "@/utils/markdown";
import { openai } from "@/ai/openai";
import { generateImageFromPrompt } from "@/ai/tools/images";
import { TOOLS, useFunctionTool } from "@/ai/tools/tools";
import { resolveTileContents, type TileContent } from "@/ai/tileContent";
import { buildContextIds, formatTileContext } from "@/ai/context/format";
import { hocuspocus } from "@/collaboration/instance";
import { docName } from "@/collaboration/server";
import { DocWriter } from "@/collaboration/DocWriter";
import { YXmlStreamWriter } from "doc/richText/writer";
import { decodeSelection, type SelectionRange } from "doc/richText/selection";
import type { GenerateImageSchema, WriteSchema } from "./schema";
import type { ToolContext } from "@/ai/tools/types";
import type { TileType } from "@/types/tiles";
import type {
  ResponseInput,
  ResponseInputItem,
  ResponseOutputItem,
  ResponseStreamEvent,
} from "openai/resources/responses/responses";
import type { AuthenticatedPageProcedureContext } from "@/utils/middleware";

export type MessageEvent = string | RichTextFormat | RichTextNode;

export interface Message {
  message: MessageEvent;
}

export interface Reference {
  id: string;
  type: TileType;
}

export type WriteEvent = Message | { reference: Reference };

interface SelectionAnchor {
  tileId: string;
  range: SelectionRange;
}

function resolveSelection(
  selection: WriteSchema["selection"],
): SelectionAnchor | null {
  if (!selection) {
    return null;
  }
  const range = decodeSelection(selection);
  return range ? { tileId: selection.tileId, range } : null;
}

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

Use "create_image" to generate an image from a text prompt; it is inserted as an image block. To place it inside a section or on a map, pass the section or map ID as "parentId" (and "coordinates" for a map pin).

## Links

Use "create_link" to create link cards for URLs.

## Sections

Use "create_section" to create a container for grouping related content. After creating a section, pass its ID as the "parentId" parameter to other tools to place content inside it.

## Maps

Use "create_map" to create an interactive map with a style (DEFAULT, SATELLITE, WATERCOLOR, or MONOCHROME). After creating a map, pass its ID as the "parentId" parameter to other tools and provide "coordinates" (lat/long) to place content as pins on the map. Use real-world geographic coordinates for locations. Use "edit_style" with "coordinates" to reposition existing tiles or to place generated images on the map.

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

interface InputOptions {
  prompt: string;
  contextText?: string;
  contextTiles: TileContent[];
  history?: WriteSchema["history"];
  selectionRef: number | null;
}

/**
 * Assembles the model input: system prompt, referenced tile content, chat
 * history, an optional selection-insert instruction, and the user's prompt.
 */
function buildInput({
  prompt,
  contextText,
  contextTiles,
  history,
  selectionRef,
}: InputOptions): ResponseInput {
  const input: ResponseInput = [{ role: "developer", content: PROMPT }];

  if (contextText) {
    input.push({ role: "user", content: contextText });
  }

  const tileContext = formatTileContext(contextTiles);
  if (tileContext) {
    input.push({ role: "user", content: tileContext });
  }

  for (const message of history ?? []) {
    input.push({ role: message.role, content: message.content });
  }

  if (selectionRef !== null) {
    input.push({
      role: "developer",
      content: `The user's selection is in block ${selectionRef}. Insert your response at the selection (replacing any selected text) using the marker:\n\n>>>@ ${selectionRef}\n...content...\n<<<`,
    });
  }

  input.push({ role: "user", content: prompt });
  return input;
}

/**
 * The artifact id of the selection's tile, registering it as a reference if it
 * is not already in context.
 */
function resolveSelectionRef(
  anchor: SelectionAnchor,
  artifactIds: string[],
): number {
  const index = artifactIds.indexOf(anchor.tileId);
  if (index !== -1) {
    return index;
  }
  artifactIds.push(anchor.tileId);
  return artifactIds.length - 1;
}

export async function* write(
  { pageId, sectionId, prompt, context, selection, history }: WriteSchema,
  ctx: AuthenticatedPageProcedureContext,
  signal?: AbortSignal,
): AsyncIterable<WriteEvent> {
  const anchor = resolveSelection(selection);

  const connection = await hocuspocus.openDirectConnection(docName(pageId), {
    userId: ctx.userId,
    sessionId: ctx.sessionId,
    pageId,
  });

  try {
    const document = connection.document;
    if (!document) {
      throw new Error(`Failed to open page document: ${pageId}`);
    }

    const contextIds = new Set(context?.tileIds ?? []);
    if (anchor) {
      contextIds.add(anchor.tileId);
    }
    const contextTiles = resolveTileContents(document, [...contextIds]);
    const artifactIds = buildContextIds(contextTiles);

    const selectionRef = anchor
      ? resolveSelectionRef(anchor, artifactIds)
      : null;
    const input = buildInput({
      prompt,
      contextText: context?.text,
      contextTiles,
      history,
      selectionRef,
    });

    const toolContext: ToolContext = {
      ...ctx,
      pageId,
      sectionId,
      model: TEXT_MODEL,
      session: new DocWriter(document),
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
        anchor,
        signal,
      );
      yield* events();
      input.push(...output, ...toolCalls);
      turn++;
      continueTurns = toolCalls.length > 0;
    }
  } finally {
    await connection.disconnect();
  }
}

export async function streamTurn(
  input: ResponseInput,
  toolContext: ToolContext,
  artifactIds: string[],
  anchor: SelectionAnchor | null,
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
  const references: Reference[] = [];

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

              if (!("tileId" in result)) {
                throw new Error(`Unexpected tool result from ${item.name}`);
              }

              const id = String(artifactIds.length);
              artifactIds.push(result.tileId);
              toolCalls.push({
                type: "function_call_output",
                call_id: item.call_id,
                output: JSON.stringify({ id }),
              });
              references.push({ id: result.tileId, type: result.type });
              return;
            }
          }
        },
      }),
    )
    .pipeThrough(transformMarkdown());

  async function* events() {
    let writer: YXmlStreamWriter | null = null;

    for await (const textEvent of text) {
      if (typeof textEvent === "object" && "destination" in textEvent) {
        if (textEvent.destination === null) {
          writer = null;
        } else {
          const tileId = toolContext.resolveArtifactId(textEvent.destination);
          const mode = textEvent.mode ?? "insert";
          const range =
            mode === "selection" && anchor && tileId === anchor.tileId
              ? anchor.range
              : undefined;
          writer = toolContext.session.streamText(tileId, mode, range);
        }
      } else if (writer) {
        writer.apply(textEvent);
      } else {
        yield { message: textEvent };
      }
    }
    for (const reference of references) {
      yield { reference };
    }
  }

  return {
    events,
    output,
    toolCalls,
  };
}
