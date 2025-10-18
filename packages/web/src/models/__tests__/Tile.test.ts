import { afterEach, describe, expect, test, vi } from "vitest";
import Tile from "@/models/Tile";
import Editor from "@/editor/Editor";
import client from "@/api/client";
import { PAGE } from "@/test/fixtures/Page";
import { TILE } from "@/test/fixtures/Tile";
import type { Animation } from "api/types/tiles";

vi.mock("@/api/client", () => ({
  default: {
    tiles: {
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

  test("maps properties to reactive values", () => {
    const tile = new Tile(editor, TILE);

    expect(tile.editor).toBe(editor);
    expect(tile.id).toBe(TILE.id);
    expect(tile.placementId).toBe(TILE.placementId);
    expect(tile.type).toBe(TILE.type);
    expect(tile.sectionId.value).toBe(TILE.sectionId);
    expect(tile.position.value).toBe(TILE.position);
    expect(tile.x.value).toBe(TILE.x);
    expect(tile.y.value).toBe(TILE.y);
    expect(tile.width.value).toBe(TILE.width);
    expect(tile.height.value).toBe(TILE.height);
    expect(tile.rowSpan.value).toBe(TILE.rowSpan);
    expect(tile.block.value).toBe(TILE.block);
    expect(tile.animation.value).toBe(TILE.animation);
  });

  describe("delete", () => {
    test("deletes the tile", async () => {
      const tile = new Tile(editor, TILE);

      await tile.delete();

      expect(client.tiles.delete.mutate).toHaveBeenCalledWith({
        pageId: PAGE.id,
        ids: [TILE.placementId],
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
        id: TILE.placementId,
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
        id: TILE.placementId,
      });
    });
  });
});
