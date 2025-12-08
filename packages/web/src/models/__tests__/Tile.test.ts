import { afterEach, describe, expect, test, vi } from "vitest";
import Tile from "@/models/Tile";
import Editor from "@/editor/Editor";
import client from "@/api/client";
import { LANDSCAPE_SIZE, PORTRAIT_SIZE } from "@/constants/size";
import { PAGE } from "@/test/fixtures/Page";
import { TILE } from "@/test/fixtures/Tile";
import type { Animation } from "api/types/tiles";

vi.mock("@/api/client", () => ({
  default: {
    tiles: {
      duplicate: {
        mutate: vi.fn(),
      },
      delete: {
        mutate: vi.fn(),
      },
      update: {
        mutate: vi.fn(),
      },
    },
  },
}));

describe("Tile", () => {
  const editor = Editor.init(PAGE);

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("duplicate", () => {
    test("duplicates the tile in the provided section", async () => {
      const tile = new Tile(editor, TILE);
      const sectionId = "new-section";

      await tile.duplicate({ sectionId });

      expect(client.tiles.duplicate.mutate).toHaveBeenCalledWith({
        pageId: PAGE.id,
        id: TILE.id,
        sectionId,
      });
    });

    test("duplicates the tile at the root when section is null", async () => {
      const tile = new Tile(editor, TILE);

      await tile.duplicate({ sectionId: null });

      expect(client.tiles.duplicate.mutate).toHaveBeenCalledWith({
        pageId: PAGE.id,
        id: TILE.id,
        sectionId: null,
      });
    });
  });

  test("maps properties to reactive values", () => {
    const tile = new Tile(editor, TILE);

    expect(tile.editor).toBe(editor);
    expect(tile.id).toBe(TILE.id);
    expect(tile.type).toBe(TILE.type);
    expect(tile.sectionId).toBeNull();
    expect(tile.order.value).toBe(TILE.order);
    expect(tile.anchor.value).toBe(TILE.anchor);
    expect(tile.dimensions.value).toBe(TILE.dimensions);
    expect(tile.x.value).toBe(TILE.x);
    expect(tile.y.value).toBe(TILE.y);
    expect(tile.width.value).toBe(TILE.width);
    expect(tile.height.value).toBe(TILE.height);
    expect(tile.rowSpan.value).toBe(TILE.rowSpan);
    expect(tile.block.value).toBe(TILE.block);
    expect(tile.animation.value).toBe(TILE.animation);
    expect(tile.hide.value).toBe(TILE.hide);
  });

  describe("delete", () => {
    test("deletes the tile", async () => {
      const tile = new Tile(editor, TILE);

      await tile.delete();

      expect(client.tiles.delete.mutate).toHaveBeenCalledWith({
        pageId: PAGE.id,
        ids: [TILE.id],
      });
    });
  });

  describe("setAnimation", () => {
    test("updates the animation and persists the placement", async () => {
      const tile = new Tile(editor, TILE);
      const animation: Animation = "GROW";

      vi.mocked(client.tiles.update.mutate).mockResolvedValue({
        ...TILE,
        animation,
      });

      await tile.setAnimation(animation);

      expect(tile.animation.value).toBe(animation);
      expect(client.tiles.update.mutate).toHaveBeenCalledWith({
        animation,
        pageId: PAGE.id,
        id: TILE.id,
      });
    });

    test("clears the animation", async () => {
      const tile = new Tile(editor, TILE);

      vi.mocked(client.tiles.update.mutate).mockResolvedValue({
        ...TILE,
        animation: null,
      });

      await tile.setAnimation(null);

      expect(tile.animation.value).toBeNull();
      expect(client.tiles.update.mutate).toHaveBeenCalledWith({
        animation: null,
        pageId: PAGE.id,
        id: TILE.id,
      });
    });
  });

  describe("setAnchor", () => {
    test("updates the anchor and persists the change", async () => {
      const tile = new Tile(editor, TILE);
      const anchor = "TOP";

      await tile.setAnchor(anchor);

      expect(tile.anchor.value).toBe(anchor);
      expect(client.tiles.update.mutate).toHaveBeenCalledWith({
        anchor,
        pageId: PAGE.id,
        id: TILE.id,
      });
    });

    test("clears the anchor", async () => {
      const tile = new Tile(editor, TILE);

      await tile.setAnchor(null);

      expect(tile.anchor.value).toBeNull();
      expect(client.tiles.update.mutate).toHaveBeenCalledWith({
        anchor: null,
        pageId: PAGE.id,
        id: TILE.id,
      });
    });
  });

  describe("setDimensions", () => {
    test("sets landscape dimensions and updates size", async () => {
      const tile = new Tile(editor, TILE);

      await tile.setDimensions("LANDSCAPE");

      expect(tile.dimensions.value).toBe("LANDSCAPE");
      expect(tile.width.value).toBe(LANDSCAPE_SIZE.width);
      expect(tile.height.value).toBe(LANDSCAPE_SIZE.height);
      expect(client.tiles.update.mutate).toHaveBeenCalledWith({
        dimensions: "LANDSCAPE",
        width: LANDSCAPE_SIZE.width,
        height: LANDSCAPE_SIZE.height,
        pageId: PAGE.id,
        id: TILE.id,
      });
    });

    test("sets portrait dimensions and updates size", async () => {
      const tile = new Tile(editor, TILE);

      await tile.setDimensions("PORTRAIT");

      expect(tile.dimensions.value).toBe("PORTRAIT");
      expect(tile.width.value).toBe(PORTRAIT_SIZE.width);
      expect(tile.height.value).toBe(PORTRAIT_SIZE.height);
      expect(client.tiles.update.mutate).toHaveBeenCalledWith({
        dimensions: "PORTRAIT",
        width: PORTRAIT_SIZE.width,
        height: PORTRAIT_SIZE.height,
        pageId: PAGE.id,
        id: TILE.id,
      });
    });
  });

  describe("setSize", () => {
    test("updates the size and persists it", async () => {
      const tile = new Tile(editor, TILE);
      const width = 99;
      const height = 101;

      await tile.setSize({ width, height });

      expect(tile.width.value).toBe(width);
      expect(tile.height.value).toBe(height);
      expect(client.tiles.update.mutate).toHaveBeenCalledWith({
        width,
        height,
        pageId: PAGE.id,
        id: TILE.id,
      });
    });
  });

  describe("setHidden", () => {
    test("updates the hidden state and persists it", async () => {
      const tile = new Tile(editor, TILE);

      await tile.setHidden(true);

      expect(tile.hide.value).toBe(true);
      expect(client.tiles.update.mutate).toHaveBeenCalledWith({
        hide: true,
        pageId: PAGE.id,
        id: TILE.id,
      });
    });
  });
});
