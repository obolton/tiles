import { afterEach, describe, expect, test, vi } from "vitest";
import Tile from "@/models/Tile";
import Editor from "@/editor/Editor";
import client from "@/api/client";
import { ASPECT_RATIOS } from "@/constants/size";
import { PAGE } from "@/test/fixtures/Page";
import { TILE } from "@/test/fixtures/Tile";
import type { Animation, ClientTextTile } from "api/types/tiles";

class TestTile extends Tile {
  serialize(): ClientTextTile {
    return {
      ...super.serialize(),
      type: "TEXT",
      content: [],
      align: "TOP",
    };
  }
}

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
    test("duplicates the tile before the specified tile", async () => {
      const tile = new TestTile(editor.page, { ...TILE, sectionId: null });
      editor.addTile(tile, false);

      const duplicatedTile = {
        ...TILE,
        id: "duplicated-tile-id",
        sectionId: null,
      };
      vi.mocked(client.tiles.duplicate.mutate).mockResolvedValue([
        duplicatedTile,
      ]);

      const result = await tile.duplicate({
        parentId: null,
        beforeId: tile.id,
      });

      expect(client.tiles.duplicate.mutate).toHaveBeenCalledWith({
        pageId: PAGE.id,
        id: TILE.id,
        sectionId: null,
        beforeId: tile.id,
      });
      expect(result.id).toBe(duplicatedTile.id);
      expect(editor.page.index.get(duplicatedTile.id)).toBe(result);
    });

    test("duplicates the tile at the end when beforeId is null", async () => {
      const tile = new TestTile(editor.page, {
        ...TILE,
        id: "tile-for-null-test",
        sectionId: null,
      });
      editor.addTile(tile, false);

      const duplicatedTile = {
        ...TILE,
        id: "duplicated-tile-id-2",
        sectionId: null,
      };
      vi.mocked(client.tiles.duplicate.mutate).mockResolvedValue([
        duplicatedTile,
      ]);

      const result = await tile.duplicate({ parentId: null, beforeId: null });

      expect(client.tiles.duplicate.mutate).toHaveBeenCalledWith({
        pageId: PAGE.id,
        id: tile.id,
        sectionId: null,
        beforeId: null,
      });
      expect(result.id).toBe(duplicatedTile.id);
      expect(editor.page.index.get(duplicatedTile.id)).toBe(result);
    });
  });

  test("serialize", () => {
    const data = { ...TILE, sectionId: null };
    const tile = new TestTile(editor.page, data);

    expect(tile.serialize()).toEqual(data);
  });

  test("maps properties to reactive values", () => {
    const tile = new TestTile(editor.page, TILE);

    expect(tile.page).toBe(editor.page);
    expect(tile.id).toBe(TILE.id);
    expect(tile.type).toBe(TILE.type);
    expect(tile.parentId.value).toBe(TILE.sectionId);
    expect(tile.order.value).toBe(TILE.order);
    expect(tile.sizing.value).toBe(TILE.sizing);
    expect(tile.x.value).toBe(TILE.x);
    expect(tile.y.value).toBe(TILE.y);
    expect(tile.width.value).toBe(TILE.width);
    expect(tile.height.value).toBe(TILE.height);
    expect(tile.rowSpan.value).toBe(TILE.rowSpan);
    expect(tile.animation.value).toBe(TILE.animation);
    expect(tile.hide.value).toBe(TILE.hide);
  });

  describe("delete", () => {
    test("deletes the tile", async () => {
      const tile = new TestTile(editor.page, TILE);

      await tile.delete();

      expect(client.tiles.delete.mutate).toHaveBeenCalledWith({
        pageId: PAGE.id,
        ids: [TILE.id],
      });
    });
  });

  describe("setAnimation", () => {
    test("updates the animation and persists the placement", async () => {
      const tile = new TestTile(editor.page, TILE);
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
      const tile = new TestTile(editor.page, TILE);

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

  describe("setSizing", () => {
    test("sets landscape sizing and computes height from aspect ratio", async () => {
      const tile = new TestTile(editor.page, TILE);
      const expectedHeight = Math.round(TILE.width! / ASPECT_RATIOS.LANDSCAPE);

      await tile.setSizing("LANDSCAPE");

      expect(tile.sizing.value).toBe("LANDSCAPE");
      expect(tile.width.value).toBe(TILE.width);
      expect(tile.height.value).toBe(expectedHeight);
      expect(client.tiles.update.mutate).toHaveBeenCalledWith({
        sizing: "LANDSCAPE",
        width: TILE.width,
        height: expectedHeight,
        pageId: PAGE.id,
        id: TILE.id,
      });
    });

    test("sets portrait sizing and computes height from aspect ratio", async () => {
      const tile = new TestTile(editor.page, TILE);
      const expectedHeight = Math.round(TILE.width! / ASPECT_RATIOS.PORTRAIT);

      await tile.setSizing("PORTRAIT");

      expect(tile.sizing.value).toBe("PORTRAIT");
      expect(tile.width.value).toBe(TILE.width);
      expect(tile.height.value).toBe(expectedHeight);
      expect(client.tiles.update.mutate).toHaveBeenCalledWith({
        sizing: "PORTRAIT",
        width: TILE.width,
        height: expectedHeight,
        pageId: PAGE.id,
        id: TILE.id,
      });
    });

    test("sets square sizing", async () => {
      const tile = new TestTile(editor.page, TILE);

      await tile.setSizing("SQUARE");

      expect(tile.sizing.value).toBe("SQUARE");
      expect(tile.width.value).toBe(TILE.width);
      expect(tile.height.value).toBe(TILE.width);
    });

    test("uses page width when tile width is null", async () => {
      const tile = new TestTile(editor.page, {
        ...TILE,
        id: "tile-with-null-width",
        width: null,
      });
      const pageWidth = editor.page.width.value;
      const expectedHeight = Math.round(pageWidth / ASPECT_RATIOS.LANDSCAPE);

      await tile.setSizing("LANDSCAPE");

      expect(tile.height.value).toBe(expectedHeight);
    });

    test("sets auto sizing without recomputing height", async () => {
      const tile = new TestTile(editor.page, TILE);
      const originalHeight = tile.height.value;

      await tile.setSizing("AUTO");

      expect(tile.sizing.value).toBe("AUTO");
      expect(tile.height.value).toBe(originalHeight);
      expect(client.tiles.update.mutate).toHaveBeenCalledWith({
        sizing: "AUTO",
        width: TILE.width,
        height: originalHeight,
        pageId: PAGE.id,
        id: TILE.id,
      });
    });
  });

  describe("setSize", () => {
    test("updates the size and persists it", async () => {
      const tile = new TestTile(editor.page, TILE);
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

    test("sets width to null for page width", async () => {
      const tile = new TestTile(editor.page, TILE);

      await tile.setSize({ width: null });

      expect(tile.width.value).toBeNull();
      expect(client.tiles.update.mutate).toHaveBeenCalledWith({
        width: null,
        height: undefined,
        pageId: PAGE.id,
        id: TILE.id,
      });
    });
  });

  describe("setHidden", () => {
    test("updates the hidden state and persists it", async () => {
      const tile = new TestTile(editor.page, TILE);

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
