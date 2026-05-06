import Editor from "@/editor/Editor";
import Image from "@/models/Image";
import ImageView from "../ImageView";
import { PAGE } from "@/test/fixtures/Page";
import { IMAGE_TILE } from "@/test/fixtures/Tile";
import type { Meta, Story } from "@/test/storybook";

const editor = Editor.init(PAGE);

const meta = {
  title: "ImageView",
} satisfies Meta;
export default meta;

const SAMPLE_IMAGE_URL = "https://images.test/landscape.jpg";

export const Default: Story = {
  render: () => {
    const image = new Image(editor.page, {
      ...IMAGE_TILE,
      id: "image-default",
      imageUrl: SAMPLE_IMAGE_URL,
    });
    return <ImageView image={image} />;
  },
};

export const WithoutCaption: Story = {
  render: () => {
    const image = new Image(editor.page, {
      ...IMAGE_TILE,
      id: "image-no-caption",
      imageUrl: SAMPLE_IMAGE_URL,
      text: [],
    });
    return <ImageView image={image} />;
  },
};

export const AutoSized: Story = {
  render: () => {
    const image = new Image(editor.page, {
      ...IMAGE_TILE,
      id: "image-auto",
      imageUrl: SAMPLE_IMAGE_URL,
      sizing: "AUTO",
      image: { width: 1600, height: 900 },
    });
    return <ImageView image={image} />;
  },
};

export const Deleted: Story = {
  render: () => {
    const image = new Image(editor.page, {
      ...IMAGE_TILE,
      id: "image-deleted",
      imageUrl: null,
    });
    return <ImageView image={image} />;
  },
};

export const WithLightbox: Story = {
  render: () => {
    const image = new Image(editor.page, {
      ...IMAGE_TILE,
      id: "image-lightbox",
      imageUrl: SAMPLE_IMAGE_URL,
    });
    return <ImageView image={image} showInLightbox />;
  },
};
