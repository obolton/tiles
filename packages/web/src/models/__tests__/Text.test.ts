import { afterEach, describe, expect, test, vi } from "vitest";
import Text from "@/models/Text";
import Editor from "@/editor/Editor";
import client from "@/api/client";
import { PAGE } from "@/test/fixtures/Page";
import { TEXT_TILE } from "@/test/fixtures/Tile";
import type { Fill, FillUpdate } from "@/components/fills/types";
import type { Color } from "@/utils/color";

vi.mock("@/api/client", () => ({
  default: {
    text: {
      update: {
        mutate: vi.fn(),
      },
    },
    tiles: {
      update: {
        mutate: vi.fn(),
      },
    },
  },
}));

describe("Text", () => {
  const editor = Editor.init(PAGE);
  const textUpdateMock = vi.mocked(client.text.update.mutate);
  const tileUpdateMock = vi.mocked(client.tiles.update.mutate);

  afterEach(() => {
    textUpdateMock.mockReset();
    tileUpdateMock.mockReset();
  });

  test("serialize", () => {
    const data = { ...TEXT_TILE, sectionId: null };
    const text = new Text(editor.page, data);

    expect(text.serialize()).toEqual(data);
  });

  test("maps properties to reactive values", () => {
    const text = new Text(editor.page, TEXT_TILE);

    expect(text.content.value).toEqual(TEXT_TILE.content);
    expect(text.align.value).toBe(TEXT_TILE.align);
    expect(text.textColor.value).toBe(TEXT_TILE.textColor);
    expect(text.background.value).toBe(TEXT_TILE.background);
  });

  describe("setVerticalAlignment", () => {
    test("updates vertical alignment and persists the change", async () => {
      const text = new Text(editor.page, TEXT_TILE);
      const align = "CENTER";

      await text.setVerticalAlignment(align);

      expect(text.align.value).toBe(align);
      expect(textUpdateMock).toHaveBeenCalledWith({
        pageId: PAGE.id,
        id: TEXT_TILE.id,
        align,
      });
    });
  });

  describe("setTextColor", () => {
    test("updates the text color", async () => {
      const text = new Text(editor.page, TEXT_TILE);
      const textColor: Color = "ffff00000000";

      await text.setTextColor(textColor);

      expect(text.textColor.value).toBe(textColor);
      expect(tileUpdateMock).toHaveBeenCalledWith({
        pageId: PAGE.id,
        id: TEXT_TILE.id,
        textColor,
      });
    });
  });

  describe("setBackground", () => {
    test("updates the background", async () => {
      const text = new Text(editor.page, TEXT_TILE);
      const colorA: Color = "ffff00000000";
      const colorB: Color = "888800000000";
      const backgroundUpdate: FillUpdate = {
        type: "color",
        color: colorA,
      };
      const background: Fill = {
        type: "gradient",
        colorA,
        colorB,
        direction: "VERTICAL",
      };

      tileUpdateMock.mockResolvedValue({
        ...TEXT_TILE,
        background,
      });

      await text.setBackground(backgroundUpdate);

      expect(tileUpdateMock).toHaveBeenCalledWith({
        pageId: PAGE.id,
        id: TEXT_TILE.id,
        background: backgroundUpdate,
      });
      expect(text.background.value).toEqual(background);
    });
  });

});
