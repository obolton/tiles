import { afterEach, describe, expect, test, vi } from "vitest";
import Tile from "@/models/Tile";
import Editor from "@/editor/Editor";
import client from "@/api/client";
import { PAGE } from "@/test/fixtures/Page";
import { TILE } from "@/test/fixtures/Tile";

vi.mock("@/api/client", () => ({
  default: {
    tiles: {
      delete: {
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
});
