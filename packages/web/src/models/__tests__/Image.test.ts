import { afterEach, describe, expect, test, vi } from "vitest";
import Image from "@/models/Image";
import Editor from "@/editor/Editor";
import client from "@/api/client";
import { createState } from "@/utils/richText/state";
import { PAGE } from "@/test/fixtures/Page";
import { IMAGE_TILE } from "@/test/fixtures/Tile";

vi.mock("@/api/client", () => ({
  default: {
    images: {
      update: {
        mutate: vi.fn(),
      },
    },
  },
}));

describe("Image", () => {
  const editor = Editor.init(PAGE);
  const updateMock = vi.mocked(client.images.update.mutate);

  afterEach(() => {
    updateMock.mockReset();
  });

  test("maps properties to reactive values", () => {
    const image = new Image(editor.page, IMAGE_TILE);

    expect(image.type).toBe("IMAGE");
    expect(image.imageUrl).toBe(IMAGE_TILE.imageUrl);
    expect(image.text.value).toEqual(IMAGE_TILE.text);
    expect(image.origin.value).toEqual({
      x: IMAGE_TILE.originX,
      y: IMAGE_TILE.originY,
    });
    expect(image.state.value).toBeNull();
  });

  describe("setOrigin", () => {
    test("updates the origin and persists it", async () => {
      const image = new Image(editor.page, IMAGE_TILE);
      const origin = { x: 10, y: 12 };

      await image.setOrigin(origin);

      expect(image.origin.value).toEqual(origin);
      expect(updateMock).toHaveBeenCalledWith({
        pageId: PAGE.id,
        id: IMAGE_TILE.id,
        origin,
      });
    });
  });

  describe("persistText", () => {
    test("persists null text when no editor state is present", async () => {
      const image = new Image(editor.page, IMAGE_TILE);

      await image.persistText();

      expect(image.text.value).toBeNull();
      expect(updateMock).toHaveBeenCalledWith({
        pageId: PAGE.id,
        id: IMAGE_TILE.id,
        text: null,
      });
    });

    test("serializes and persists the current editor state", async () => {
      const image = new Image(editor.page, IMAGE_TILE);
      image.state.value = createState(IMAGE_TILE.text);

      await image.persistText();

      expect(image.text.value).toEqual(IMAGE_TILE.text);
      expect(updateMock).toHaveBeenCalledWith({
        pageId: PAGE.id,
        id: IMAGE_TILE.id,
        text: IMAGE_TILE.text,
      });
    });
  });
});
