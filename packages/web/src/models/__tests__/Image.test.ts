import { describe, expect, test } from "vitest";
import * as Y from "yjs";
import Image, { type CreateImageInput } from "@/models/Image";
import Editor from "@/editor/Editor";
import { createState } from "@/utils/richText/state";
import { PAGE } from "@/test/fixtures/Page";
import type { RichText } from "@/utils/richText/types";

const IMAGE_TEXT: RichText = [
  {
    type: "paragraph",
    align: 0,
    children: [{ type: "text", text: "Caption", format: 0, pending: undefined, size: 1 }],
  },
];

const IMAGE_PROPS: Omit<CreateImageInput, "parentId" | "beforeId"> = {
  imageId: "image-id",
  size: { width: 1920, height: 1080 },
  alt: null,
  text: IMAGE_TEXT,
};

describe("Image", () => {
  const editor = Editor.init(PAGE, new Y.Doc());

  function createImage(overrides: Partial<CreateImageInput> = {}): Image {
    return editor.page.createTile(Image.createMap({ ...IMAGE_PROPS, ...overrides }), {}) as Image;
  }

  test("maps properties to reactive values", () => {
    const image = createImage();

    expect(image.type).toBe("IMAGE");
    expect(image.imageId.value).toBe(IMAGE_PROPS.imageId);
    expect(image.imageUrl).toContain(IMAGE_PROPS.imageId);
    expect(image.size.value).toEqual(IMAGE_PROPS.size);
    expect(image.alt.value).toBe(IMAGE_PROPS.alt);
    expect(image.text.value).toEqual(IMAGE_TEXT);
    expect(image.origin.value).toEqual({ x: 0, y: 0 });
    expect(image.state.value).toBeNull();
  });

  describe("persistText", () => {
    test("clears text when no editor state is present", () => {
      const image = createImage();
      image.persistText();

      expect(image.text.value).toBeNull();
    });

    test("serializes the current editor state into text", () => {
      const image = createImage();
      image.state.value = createState(IMAGE_TEXT);
      image.persistText();

      expect(image.text.value).toEqual(IMAGE_TEXT);
    });
  });
});
