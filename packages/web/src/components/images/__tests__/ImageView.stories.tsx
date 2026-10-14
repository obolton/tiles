import * as Y from "yjs";
import Editor from "@/editor/Editor";
import Image from "@/models/Image";
import ImageView from "../ImageView";
import { PAGE } from "@/test/fixtures/Page";
import type { Meta, Story } from "@/test/storybook";
import type { RichText } from "@/utils/richText/types";

const editor = Editor.init(PAGE, new Y.Doc());

const meta = {
  title: "ImageView",
} satisfies Meta;
export default meta;

const CAPTION: RichText = [
  {
    type: "paragraph",
    align: 0,
    children: [{ type: "text", text: "A sample caption", format: 0 }],
  },
];

type ImageProps = Parameters<typeof Image.createMap>[0];

function createImage(overrides: Partial<ImageProps> = {}): Image {
  return editor.page.createTile(
    Image.createMap({
      imageId: "sample-image",
      size: { width: 1200, height: 800 },
      text: CAPTION,
      alt: "A sample image",
      ...overrides,
    }),
    {},
  ) as Image;
}

export const Default: Story = {
  render: () => <ImageView image={createImage()} />,
};

export const WithoutCaption: Story = {
  render: () => <ImageView image={createImage({ text: [] })} />,
};

export const AutoSized: Story = {
  render: () => (
    <ImageView
      image={createImage({
        sizing: "AUTO",
        size: { width: 1600, height: 900 },
      })}
    />
  ),
};

export const Deleted: Story = {
  render: () => {
    const image = createImage();
    image.imageId.value = null;
    return <ImageView image={image} />;
  },
  parameters: {
    a11y: {
      config: {
        // The placeholder text uses the global --placeholder-color token, which is below the AA
        // contrast threshold by design.
        rules: [{ id: "color-contrast", enabled: false }],
      },
    },
  },
};

export const WithLightbox: Story = {
  render: () => <ImageView image={createImage()} showInLightbox />,
};
