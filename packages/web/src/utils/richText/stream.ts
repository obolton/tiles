import { schema } from "./schema";
import { closest, getListDepth } from "./helpers";
import Editor from "@/editor/Editor";
import type { EditorView } from "prosemirror-view";
import type { EditorState, Transaction } from "prosemirror-state";
import type { Mark } from "prosemirror-model";
import type { ClientTile } from "@/types/tiles";
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

export type RichTextNode = ParagraphNode | HeadingNode | ListItemNode;

export interface RichTextFormat {
  bold?: boolean;
  italic?: boolean;
}

export interface Destination {
  destination: string | null;
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

export type StreamEvent = RichTextStreamEvent | ArtifactEvent;

export type ReactiveState = Reactive<EditorState | null>;

function insertPendingNode(tr: Transaction) {
  const { $from } = tr.selection;

  // Replace the current textblock if it is empty
  if ($from.parent.isTextblock && $from.parent.content.size === 0) {
    const from = $from.before();
    const to = $from.after();
    tr.replaceWith(from, to, schema.nodes.pending.create());
    return from + 1;
  }

  const pos = $from.after();
  tr.insert(pos, schema.nodes.pending.create());
  return pos + 1;
}

function dispatch(state: ReactiveState, tr: Transaction) {
  const newState = state.value?.apply(tr) ?? null;
  state.value = newState;
}

export async function insertFromStream(
  view: EditorView,
  stream: AsyncIterable<StreamEvent>,
) {
  let startPos: number | null = null;
  let pos: number | null = null;
  let bold = false;
  let italic = false;
  let output: ReactiveState | null = null;

  for await (const event of stream) {
    if (typeof event === "object" && "artifact" in event) {
      Editor.current.addTile(event.artifact);
      continue;
    }

    if (typeof event === "object" && "destination" in event) {
      if (event.destination) {
        output = Editor.current.getTextEditorState(event.destination);
      } else {
        output = null;
      }
      startPos = null;
      pos = null;
      continue;
    }

    const state = output ? output.value : view.state;
    if (!state) {
      continue;
    }

    const tr = state.tr;

    if (startPos === null || pos === null) {
      startPos = insertPendingNode(tr);
      pos = startPos;
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
        switch (event.type) {
          case "paragraph":
            {
              pos = tr.doc.resolve(startPos).end();
              const node = schema.nodes.paragraph.create();
              tr.insert(pos, node);
              pos += node.nodeSize - 1;
            }
            break;

          case "heading":
            {
              pos = tr.doc.resolve(startPos).end();
              const node = schema.nodes.heading.create({ level: event.level });
              tr.insert(pos, node);
              pos += node.nodeSize - 1;
            }
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
                (node) => node.type === schema.nodes.list_item,
              );

              if (!listItem) {
                pos = tr.doc.resolve(startPos).end();
                const node = listNodeType.create(null, createListItem());
                tr.insert(pos, node);
                pos += node.nodeSize - 3;
                break;
              }

              const depth = getListDepth($pos);
              const afterPos = listItem.pos + listItem.node.nodeSize;

              // Insert item at same depth
              if (event.depth === depth) {
                pos = afterPos;
                const node = createListItem();
                tr.insert(pos, node);
                pos += node.nodeSize - 2;

                // Increase depth
              } else if (event.depth > depth) {
                pos = afterPos - 1;
                const node = listNodeType.create(null, createListItem());
                tr.insert(pos, node);
                pos += node.nodeSize - 3;

                // Decrease depth
              } else if (event.depth >= 0) {
                pos = afterPos + 2;
                const node = createListItem();
                tr.insert(pos, node);
                pos += node.nodeSize - 2;

                // If the top level is reached, insert a new list
              } else {
                pos = afterPos + 3;
                const node = listNodeType.create(null, createListItem());
                tr.insert(pos, node);
                pos += node.nodeSize - 3;
              }
            }
            break;
        }
      }
    }

    if (output) {
      dispatch(output, tr);
    } else {
      view.dispatch(tr);
    }
  }
}
