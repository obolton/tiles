import { schema } from "./schema";
import { closest } from "./helpers";
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

export async function insertFromStream(
  view: EditorView,
  stream: AsyncIterable<RichTextStreamEvent>,
  atPos: number,
) {
  const { dispatch } = view;
  let pos = atPos;
  let bold = false;
  let italic = false;

  const pendingMark = schema.marks.pending.create();

  for await (const event of stream) {
    const {
      state: { tr },
    } = view;

    if (typeof event === "string") {
      const marks: Mark[] = [pendingMark];
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
        const $pos = tr.doc.resolve(pos);
        pos = $pos.after(1);

        switch (event.type) {
          case "paragraph":
            {
              const node = schema.nodes.paragraph.create();
              tr.insert(pos, node);
              pos += node.nodeSize - 1;
            }
            break;

          case "heading":
            {
              const node = schema.nodes.heading.create({ level: event.level });
              tr.insert(pos, node);
              pos += node.nodeSize - 1;
            }
            break;

          case "listitem":
            {
              const listNodeType =
                event.listType === "ordered"
                  ? schema.nodes.ordered_list
                  : schema.nodes.unordered_list;
              const list = closest($pos, (node) => node.type === listNodeType);
              if (list) {
                pos = list.pos + list.node.nodeSize - 1;
                const node = schema.nodes.list_item.create(
                  null,
                  schema.nodes.paragraph.create(),
                );
                tr.insert(pos, node);
                pos += node.nodeSize - 2;
              } else {
                const node = listNodeType.create(
                  null,
                  schema.nodes.list_item.create(
                    null,
                    schema.nodes.paragraph.create(),
                  ),
                );
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
