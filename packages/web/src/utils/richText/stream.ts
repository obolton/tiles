import { schema } from "./schema";
import { closest, getListDepth } from "./helpers";
import type { EditorView } from "prosemirror-view";
import type { Mark } from "prosemirror-model";

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

export type RichTextFormat = { bold?: boolean; italic?: boolean };

export type RichTextStreamEvent = string | RichTextFormat | RichTextNode;

function createListItem() {
  return schema.nodes.list_item.create(null, schema.nodes.paragraph.create());
}

export async function insertFromStream(
  view: EditorView,
  stream: AsyncIterable<RichTextStreamEvent>,
) {
  const { dispatch } = view;
  const { $from } = view.state.selection;
  let startPos: number;

  if ($from.parent.isTextblock && $from.parent.content.size === 0) {
    const from = $from.before();
    dispatch(
      view.state.tr.replaceWith(
        from,
        $from.after(),
        schema.nodes.pending.create(),
      ),
    );
    startPos = from + 1;
  } else {
    const from = $from.after();
    dispatch(view.state.tr.insert(from, schema.nodes.pending.create()));
    startPos = from + 1;
  }

  let pos = startPos;
  let bold = false;
  let italic = false;

  for await (const event of stream) {
    const {
      state: { tr },
    } = view;

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
              } else if (event.depth > 0) {
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

    dispatch(tr);
  }
}
