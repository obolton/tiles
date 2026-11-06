import * as Y from "yjs";
import { prosemirrorToYXmlFragment } from "y-prosemirror";
import Editor from "@/editor/Editor";
import Section from "@/models/Section";
import Text from "@/models/Text";
import DocumentBody from "../DocumentBody";
import { deserialize } from "@/utils/richText/deserialize";
import { PAGE } from "@/test/fixtures/Page";
import type { Meta, Story } from "@/test/storybook";
import type { RichText } from "doc/types/richText";

const editor = Editor.init({ ...PAGE, type: "DOCUMENT" }, new Y.Doc());
const body = editor.page.body!;

const meta = {
  title: "DocumentBody",
} satisfies Meta;
export default meta;

function paragraph(text: string): RichText[number] {
  return { type: "paragraph", align: 0, children: [{ type: "text", text, format: 0 }] };
}

function fill(content: RichText) {
  body.fragment.delete(0, body.fragment.length);
  prosemirrorToYXmlFragment(deserialize(content), body.fragment);
}

export const TextOnly: Story = {
  render: () => {
    fill([
      {
        type: "heading",
        level: 1,
        align: 0,
        children: [{ type: "text", text: "Title", format: 0 }],
      },
      paragraph("A document body with text only."),
    ]);
    return <DocumentBody body={body} />;
  },
};

export const WithEmbeddedTiles: Story = {
  render: () => {
    const list = editor.page.createTile(Section.createMap({ layout: "VERTICAL" }), { at: null });
    editor.page.createTile(Text.createMap({ content: [paragraph("Inside the list")] }), {
      parentId: list.id,
    });
    const section = editor.page.createTile(Section.createMap({ layout: "GRID" }), { at: null });
    editor.page.createTile(Text.createMap({ content: [paragraph("Inside the grid")] }), {
      parentId: section.id,
    });
    fill([
      paragraph("Before the section."),
      { type: "tile", id: list.id },
      {
        type: "list",
        listType: 1,
        children: [
          { type: "listitem", checked: false, children: [paragraph("An item with a section")] },
          {
            type: "listitem",
            checked: false,
            children: [paragraph("Another item"), { type: "tile", id: section.id }],
          },
        ],
      },
      paragraph("After."),
    ]);
    return <DocumentBody body={body} />;
  },
};
