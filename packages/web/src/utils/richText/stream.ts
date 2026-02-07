import { schema } from "./schema";
import { closest, getListDepth } from "./helpers";
import { handleStreamAction } from "./actions";
import Editor from "@/editor/Editor";
import Text from "@/models/Text";
import type { EditorView } from "prosemirror-view";
import type { EditorState, Transaction } from "prosemirror-state";
import type { Mark, Node } from "prosemirror-model";
import type { ClientTile } from "api/types/tiles";
import type { Reactive } from "@/utils/reactivity";

export interface ParagraphNode {
  type: "paragraph";
}

export interface HeadingNode {
  type: "heading";
  level: number;
}

export interface ListItemNode {
  type: "listitem";
  listType: "ordered" | "unordered";
  depth: number;
}

export interface DividerNode {
  type: "divider";
}

export interface CodeNode {
  type: "code";
  language: string;
}

export type RichTextNode =
  | ParagraphNode
  | HeadingNode
  | ListItemNode
  | DividerNode
  | CodeNode;

export interface RichTextFormat {
  bold?: boolean;
  italic?: boolean;
}

export type DestinationMode = "insert" | "replace" | "append" | "prepend";

export interface Destination {
  destination: string | null;
  mode?: DestinationMode;
}

export type RichTextStreamEvent =
  | string
  | RichTextFormat
  | RichTextNode
  | Destination;

function createListItem() {
  return schema.nodes.list_item.create(null, schema.nodes.paragraph.create());
}

export interface ArtifactEvent {
  artifact: ClientTile;
}

export interface Action {
  readonly type: string;
  readonly data: Record<string, unknown>;
}

export interface ActionEvent {
  action: Action;
}

export type StreamEvent = RichTextStreamEvent | ArtifactEvent | ActionEvent;

export type ReactiveState = Reactive<EditorState | null>;

function getInsertPosition(tr: Transaction) {
  const { $from } = tr.selection;

  // If inside an empty textblock, use current position
  if ($from.parent.isTextblock && $from.parent.content.size === 0) {
    return $from.pos;
  }

  // Otherwise, insert a new paragraph after current block
  const pos = $from.after();
  tr.insert(pos, schema.nodes.paragraph.create());
  return pos + 1;
}

type InsertMode = "after" | "before" | "replace";

/**
 * Insert a node at the current position.
 * - "replace": replaces the current textblock node with the new node
 * - "before": inserts before the top-level block ancestor
 * - "after": inserts after the top-level block ancestor (default)
 * @returns The position where the node was inserted.
 */
export function insertNode(
  tr: Transaction,
  pos: number,
  node: Node,
  mode: InsertMode = "after",
): number {
  const $pos = tr.doc.resolve(pos);

  switch (mode) {
    case "replace": {
      const from = $pos.before();
      const to = $pos.after();
      tr.replaceWith(from, to, node);
      return from;
    }
    case "before": {
      const beforePos = $pos.before(1);
      tr.insert(beforePos, node);
      return beforePos;
    }
    case "after":
    default: {
      const afterPos = $pos.after(1);
      tr.insert(afterPos, node);
      return afterPos;
    }
  }
}

function dispatch(state: ReactiveState, tr: Transaction) {
  const newState = state.value?.apply(tr) ?? null;
  state.value = newState;
}

type InsertDirection = "before" | "after";

interface DestinationState {
  output: ReactiveState | null;
  pos: number | null;
  direction: InsertDirection;
  replaceEmptyBlock: boolean;
}

function handleDestination(
  event: Destination,
  destinationTileIds: Set<string>,
): DestinationState {
  if (!event.destination) {
    return {
      output: null,
      pos: null,
      direction: "after",
      replaceEmptyBlock: false,
    };
  }

  destinationTileIds.add(event.destination);
  const existingTile = Editor.current.getTile(event.destination);

  // Editing existing tile
  if (existingTile instanceof Text) {
    const output = existingTile.state;
    if (!output.value) {
      return {
        output,
        pos: null,
        direction: "after",
        replaceEmptyBlock: false,
      };
    }

    switch (event.mode) {
      case "replace": {
        const tr = output.value.tr;
        tr.replaceWith(0, tr.doc.content.size, schema.nodes.paragraph.create());
        dispatch(output, tr);
        return { output, pos: 1, direction: "after", replaceEmptyBlock: true };
      }
      case "append":
        return {
          output,
          pos: output.value.doc.content.size,
          direction: "after",
          replaceEmptyBlock: false,
        };
      case "prepend":
        return {
          output,
          pos: 1,
          direction: "before",
          replaceEmptyBlock: false,
        };
      default:
        return {
          output,
          pos: null,
          direction: "after",
          replaceEmptyBlock: false,
        };
    }
  }

  // New artifact tile (from create_text tool)
  const output = Editor.current.getTextEditorState(event.destination);
  return { output, pos: null, direction: "after", replaceEmptyBlock: false };
}

export async function insertFromStream(
  view: EditorView,
  stream: AsyncIterable<StreamEvent>,
) {
  let pos: number | null = null;
  let bold = false;
  let italic = false;
  let output: ReactiveState | null = null;
  let direction: InsertDirection = "after";
  let replaceEmptyBlock = false;
  const destinationTileIds = new Set<string>();

  for await (const event of stream) {
    if (typeof event === "object" && "action" in event) {
      await handleStreamAction(event.action);
      continue;
    }

    if (typeof event === "object" && "artifact" in event) {
      const tile = Editor.current.createTile(event.artifact);
      Editor.current.addTile(tile, event.artifact.sectionId);
      continue;
    }

    if (typeof event === "object" && "destination" in event) {
      const state = handleDestination(event, destinationTileIds);
      output = state.output;
      pos = state.pos;
      direction = state.direction;
      replaceEmptyBlock = state.replaceEmptyBlock;
      continue;
    }

    const state = output ? output.value : view.state;
    if (!state) {
      continue;
    }

    const tr = state.tr;

    if (pos === null) {
      pos = getInsertPosition(tr);

      // Check if we're starting inside an empty textblock
      const $pos = tr.doc.resolve(pos);
      replaceEmptyBlock =
        $pos.parent.isTextblock && $pos.parent.content.size === 0;
    }

    if (typeof event === "string") {
      const marks: Mark[] = [];
      if (bold) {
        marks.push(schema.marks.bold.create());
      }
      if (italic) {
        marks.push(schema.marks.italic.create());
      }
      tr.setStoredMarks(marks);
      tr.insertText(event, pos);
      pos += event.length;
    } else {
      if ("bold" in event && typeof event.bold === "boolean") {
        bold = event.bold;
      }

      if ("italic" in event && typeof event.italic === "boolean") {
        italic = event.italic;
      }

      if ("type" in event) {
        const mode: InsertMode = replaceEmptyBlock ? "replace" : direction;

        switch (event.type) {
          case "paragraph":
            // If already inside an empty paragraph, no action needed
            if (!replaceEmptyBlock) {
              pos =
                insertNode(
                  tr,
                  pos,
                  schema.nodes.paragraph.create(),
                  direction,
                ) + 1;
            }
            break;

          case "heading":
            pos =
              insertNode(
                tr,
                pos,
                schema.nodes.heading.create({ level: event.level }),
                mode,
              ) + 1;
            break;

          case "listitem":
            {
              const $pos = tr.doc.resolve(pos);
              const listNodeType =
                event.listType === "ordered"
                  ? schema.nodes.ordered_list
                  : schema.nodes.unordered_list;

              const listItem = closest(
                $pos,
                (n) => n.type === schema.nodes.list_item,
              );

              // Not currently in a list - create a new one
              if (!listItem) {
                const node = listNodeType.create(null, createListItem());
                pos = insertNode(tr, pos, node, mode) + 3;
                break;
              }

              const depth = getListDepth($pos);
              const afterPos = listItem.pos + listItem.node.nodeSize;

              if (event.depth === depth) {
                // Insert sibling item at same depth
                tr.insert(afterPos, createListItem());
                pos = afterPos + 2;
              } else if (event.depth > depth) {
                // Increase depth: nest a new list inside current item
                const node = listNodeType.create(null, createListItem());
                tr.insert(afterPos - 1, node);
                pos = afterPos - 1 + 3;
              } else if (event.depth >= 0) {
                // Decrease depth: insert after parent list item
                tr.insert(afterPos + 2, createListItem());
                pos = afterPos + 2 + 2;
              } else {
                // Top level reached: create a new list after current one
                const node = listNodeType.create(null, createListItem());
                tr.insert(afterPos + 3, node);
                pos = afterPos + 3 + 3;
              }
            }
            break;

          case "divider":
            pos = insertNode(tr, pos, schema.nodes.divider.create(), mode) + 1;
            break;

          case "code":
            pos =
              insertNode(
                tr,
                pos,
                schema.nodes.code.create({ language: event.language }),
                mode,
              ) + 1;
            break;
        }
        replaceEmptyBlock = false;
      }
    }

    if (output) {
      dispatch(output, tr);
    } else {
      view.dispatch(tr);
    }
  }

  // Persist all destination tiles that received streamed content
  for (const tileId of destinationTileIds) {
    const tile = Editor.current.getTile(tileId);
    if (tile instanceof Text) {
      tile.persist();
    }
  }
}
