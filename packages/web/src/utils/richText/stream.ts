import { schema } from "./schema";
import { closest } from "./helpers";
import type { EditorView } from "prosemirror-view";
import type { Mark } from "prosemirror-model";

export type RichTextBlockType = "P" | "H1" | "H2" | "H3" | "UL" | "OL";

export type RichTextStreamEvent =
  | string
  | { bold: boolean }
  | { italic: boolean }
  | { block: RichTextBlockType };

export async function insertFromStream(
  view: EditorView,
  stream: AsyncIterable<RichTextStreamEvent>,
  atPos: number,
) {
  const { dispatch } = view;
  let pos = atPos;
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
      if ("bold" in event) {
        bold = event.bold;
      }

      if ("italic" in event) {
        italic = event.italic;
      }

      if ("block" in event) {
        const $pos = tr.doc.resolve(pos);
        pos = $pos.after(1);

        switch (event.block) {
          case "P":
            {
              const node = schema.nodes.paragraph.create();
              tr.insert(pos, node);
              pos += node.nodeSize - 1;
            }
            break;

          case "H1":
            {
              const node = schema.nodes.heading.create({ level: 1 });
              tr.insert(pos, node);
              pos += node.nodeSize - 1;
            }
            break;

          case "H2":
            {
              const node = schema.nodes.heading.create({ level: 2 });
              tr.insert(pos, node);
              pos += node.nodeSize - 1;
            }
            break;

          case "H3":
            {
              const node = schema.nodes.heading.create({ level: 3 });
              tr.insert(pos, node);
              pos += node.nodeSize - 1;
            }
            break;

          case "UL":
            {
              const list = closest(
                $pos,
                (node) => node.type === schema.nodes.unordered_list,
              );
              if (list) {
                pos = list.pos + list.node.nodeSize - 1;
                const node = schema.nodes.list_item.create(
                  null,
                  schema.nodes.paragraph.create(),
                );
                tr.insert(pos, node);
                pos += node.nodeSize - 2;
              } else {
                const node = schema.nodes.unordered_list.create(
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

          case "OL":
            {
              const list = closest(
                $pos,
                (node) => node.type === schema.nodes.ordered_list,
              );
              if (list) {
                pos = list.pos + list.node.nodeSize - 1;
                const node = schema.nodes.list_item.create(
                  null,
                  schema.nodes.paragraph.create(),
                );
                tr.insert(pos, node);
                pos += node.nodeSize - 2;
              } else {
                const node = schema.nodes.ordered_list.create(
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
