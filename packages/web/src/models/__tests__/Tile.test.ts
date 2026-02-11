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
    test("duplicates the tile before the specified tile", async () => {
      const tile = new Tile(editor.page, { ...TILE, sectionId: null });
      editor.addTile(tile, null, null, false);

      const duplicatedTile = {
        ...TILE,
        id: "duplicated-tile-id",
        sectionId: null,
      };
      vi.mocked(client.tiles.duplicate.mutate).mockResolvedValue([
        duplicatedTile,
      ]);

      const result = await tile.duplicate({
        sectionId: null,
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
      const tile = new Tile(editor.page, {
        ...TILE,
        id: "tile-for-null-test",
        sectionId: null,
      });
      editor.addTile(tile, null, null, false);

      const duplicatedTile = {
        ...TILE,
        id: "duplicated-tile-id-2",
        sectionId: null,
      };
      vi.mocked(client.tiles.duplicate.mutate).mockResolvedValue([
        duplicatedTile,
      ]);

      const result = await tile.duplicate({ sectionId: null, beforeId: null });

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

  test("maps properties to reactive values", () => {
    const tile = new Tile(editor.page, TILE);

    expect(tile.page).toBe(editor.page);
    expect(tile.id).toBe(TILE.id);
    expect(tile.type).toBe(TILE.type);
    expect(tile.sectionId).toBeNull();
    expect(tile.order.value).toBe(TILE.order);
    expect(tile.dimensions.value).toBe(TILE.dimensions);
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
      const tile = new Tile(editor.page, TILE);

      await tile.delete();

      expect(client.tiles.delete.mutate).toHaveBeenCalledWith({
        pageId: PAGE.id,
        ids: [TILE.id],
      });
    });
  });

  describe("setAnimation", () => {
    test("updates the animation and persists the placement", async () => {
      const tile = new Tile(editor.page, TILE);
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
      const tile = new Tile(editor.page, TILE);

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

  describe("setDimensions", () => {
    test("sets landscape dimensions and updates size", async () => {
      const tile = new Tile(editor.page, TILE);

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
      const tile = new Tile(editor.page, TILE);

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
      const tile = new Tile(editor.page, TILE);
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
      const tile = new Tile(editor.page, TILE);

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
