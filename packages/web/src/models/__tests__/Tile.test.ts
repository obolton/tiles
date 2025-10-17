import { afterEach, describe, expect, test, vi } from "vitest";
import Tile from "@/models/Tile";
import Editor, { type Page } from "@/editor/Editor";
import client from "@/api/client";
import type { ClientTile } from "api/types/tiles";

vi.mock("@/api/client", () => ({
  default: {
    tiles: {
      delete: {
        mutate: vi.fn(),
      },
    },
  },
}));

const PAGE: Page = {
  id: "page-id",
  workspaceId: "workspace-id",
  updatedAt: "2025-01-01",
  published: true,
  author: {
    id: "user-id",
    name: "Test User",
    username: "test",
    imageUrl: "https://tiles.dev",
  },
  title: "Test Page",
  coverImageUrl: null,
  font: "CLASSIC",
  color: {
    l: 1,
    c: 0,
    h: 0,
  },
  sections: [],
  tiles: [],
  access: [],
  invites: [],
  dropdowns: [],
};

const TILE: ClientTile = {
  id: "tile-id",
  placementId: "placement-id",
  type: "TEXT",
  sectionId: "section-id",
  position: 3,
  x: 5,
  y: 7,
  width: 11,
  height: 13,
  rowSpan: 2,
  block: false,
  align: "TOP",
  textColor: null,
  background: null,
  content: [],
};

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
