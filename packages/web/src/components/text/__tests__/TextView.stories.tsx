import * as Y from "yjs";
import Editor from "@/editor/Editor";
import Text from "@/models/Text";
import TextView from "../TextView";
import { TextFormat } from "doc/types/richText";
import { PAGE } from "@/test/fixtures/Page";
import type { Meta, Story } from "@/test/storybook";
import type { RichText } from "doc/types/richText";
import type { TextTile } from "doc/types/tiles";

const editor = Editor.init(PAGE, new Y.Doc());

const meta = {
  title: "TextView",
} satisfies Meta;
export default meta;

function paragraph(text: string): RichText {
  return [
    {
      type: "paragraph",
      align: 0,
      children: [{ type: "text", text, format: 0, size: 1, pending: undefined }],
    },
  ];
}

function createText(props: { align?: TextTile["align"]; content?: RichText }): Text {
  return editor.page.createTile(Text.createMap(props), {}) as Text;
}

export const Default: Story = {
  render: () => {
    const text = createText({ content: paragraph("Hello world") });
    return <TextView text={text} />;
  },
};

export const AlignedTop: Story = {
  render: () => {
    const text = createText({
      align: "TOP",
      content: paragraph("Aligned to the top"),
    });
    return <TextView text={text} />;
  },
};

export const AlignedCenter: Story = {
  render: () => {
    const text = createText({
      align: "CENTER",
      content: paragraph("Centered vertically"),
    });
    return <TextView text={text} />;
  },
};

export const AlignedBottom: Story = {
  render: () => {
    const text = createText({
      align: "BOTTOM",
      content: paragraph("Aligned to the bottom"),
    });
    return <TextView text={text} />;
  },
};

export const RichFormatting: Story = {
  render: () => {
    const text = createText({
      align: "CENTER",
      content: [
        {
          type: "paragraph",
          align: 0,
          children: [
            {
              type: "text",
              text: "Bold",
              format: TextFormat.BOLD,
              size: 1,
              pending: undefined,
            },
            {
              type: "text",
              text: ", ",
              format: 0,
              size: 1,
              pending: undefined,
            },
            {
              type: "text",
              text: "italic",
              format: TextFormat.ITALIC,
              size: 1,
              pending: undefined,
            },
            {
              type: "text",
              text: ", and ",
              format: 0,
              size: 1,
              pending: undefined,
            },
            {
              type: "text",
              text: "underline",
              format: TextFormat.UNDERLINE,
              size: 1,
              pending: undefined,
            },
            {
              type: "text",
              text: ".",
              format: 0,
              size: 1,
              pending: undefined,
            },
          ],
        },
      ],
    });
    return <TextView text={text} />;
  },
};

export const LongContent: Story = {
  render: () => {
    const text = createText({
      align: "TOP",
      content: [
        {
          type: "paragraph",
          align: 0,
          children: [
            {
              type: "text",
              text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.",
              format: 0,
              size: 1,
              pending: undefined,
            },
          ],
        },
      ],
    });
    return <TextView text={text} />;
  },
};

export const Empty: Story = {
  render: () => {
    const text = createText({ content: [] });
    return <TextView text={text} />;
  },
};
