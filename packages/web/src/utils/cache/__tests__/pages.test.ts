import { describe, expect, test, afterEach } from "vitest";
import { PAGE } from "@/test/fixtures/Page";
import { TEXT_TILE, IMAGE_TILE } from "@/test/fixtures/Tile";
import { initializeCache, destroyCache } from "../index";
import {
  cachePage,
  cacheTiles,
  getCachedPageData,
  invalidateCachedPageData,
  invalidateAllPages,
} from "../pages";
import type { TileBase } from "doc/types/tiles";

const TILES: TileBase[] = [
  { ...TEXT_TILE, id: "tile-1", sectionId: null },
  { ...IMAGE_TILE, id: "tile-2", sectionId: null },
];

describe("page cache", () => {
  afterEach(async () => {
    await destroyCache();
  });

  describe("cachePage", () => {
    test("stores page data", async () => {
      await initializeCache("user-1", "workspace-1");
      await cachePage(PAGE);

      const cached = await getCachedPageData(PAGE.id);
      expect(cached).not.toBeNull();
      expect(cached?.id).toBe(PAGE.id);
      expect(cached?.title).toBe(PAGE.title);
    });

    test("overwrites previously cached page data", async () => {
      await initializeCache("user-1", "workspace-1");
      await cachePage(PAGE);
      await cachePage({ ...PAGE, title: "Updated Title" });

      const cached = await getCachedPageData(PAGE.id);
      expect(cached?.title).toBe("Updated Title");
    });
  });

  describe("getCachedPageData", () => {
    test("returns null for an uncached page", async () => {
      await initializeCache("user-1", "workspace-1");
      expect(await getCachedPageData("nonexistent")).toBeNull();
    });

    test("returns an empty tiles array when none are cached", async () => {
      await initializeCache("user-1", "workspace-1");
      await cachePage(PAGE);

      const cached = await getCachedPageData(PAGE.id);
      expect(cached?.tiles).toEqual([]);
    });

    test("returns tiles cached via cacheTiles", async () => {
      await initializeCache("user-1", "workspace-1");
      await cachePage(PAGE);
      await cacheTiles(PAGE.id, TILES);

      const cached = await getCachedPageData(PAGE.id);
      expect(cached?.tiles).toHaveLength(2);

      const textTile = cached?.tiles.find((t) => t.id === "tile-1");
      expect(textTile?.type).toBe("TEXT");
      expect(textTile?.sectionId).toBeNull();
    });

    test("strips pageId from returned tiles", async () => {
      await initializeCache("user-1", "workspace-1");
      await cachePage(PAGE);
      await cacheTiles(PAGE.id, TILES);

      const cached = await getCachedPageData(PAGE.id);
      for (const tile of cached?.tiles ?? []) {
        expect(tile).not.toHaveProperty("pageId");
      }
    });

    test("isolates tiles between pages", async () => {
      await initializeCache("user-1", "workspace-1");
      await cachePage({ ...PAGE, id: "page-1" });
      await cachePage({ ...PAGE, id: "page-2" });
      await cacheTiles("page-1", [{ ...TEXT_TILE, id: "tile-a", sectionId: null }]);
      await cacheTiles("page-2", [
        { ...TEXT_TILE, id: "tile-b", sectionId: null },
        { ...IMAGE_TILE, id: "tile-c", sectionId: null },
      ]);

      const cached1 = await getCachedPageData("page-1");
      const cached2 = await getCachedPageData("page-2");

      expect(cached1?.tiles).toHaveLength(1);
      expect(cached1?.tiles[0]?.id).toBe("tile-a");
      expect(cached2?.tiles).toHaveLength(2);
    });
  });

  describe("invalidateCachedPageData", () => {
    test("removes a cached page", async () => {
      await initializeCache("user-1", "workspace-1");
      await cachePage(PAGE);

      await invalidateCachedPageData(PAGE.id);

      expect(await getCachedPageData(PAGE.id)).toBeNull();
    });

    test("removes tiles for the invalidated page only", async () => {
      await initializeCache("user-1", "workspace-1");
      await cachePage({ ...PAGE, id: "page-1" });
      await cachePage({ ...PAGE, id: "page-2" });
      await cacheTiles("page-1", [{ ...TEXT_TILE, id: "tile-a", sectionId: null }]);
      await cacheTiles("page-2", [{ ...TEXT_TILE, id: "tile-b", sectionId: null }]);

      await invalidateCachedPageData("page-1");

      expect(await getCachedPageData("page-1")).toBeNull();
      expect((await getCachedPageData("page-2"))?.tiles).toHaveLength(1);
    });

    test("is safe to call for a nonexistent page", async () => {
      await initializeCache("user-1", "workspace-1");
      await expect(invalidateCachedPageData("nonexistent")).resolves.not.toThrow();
    });
  });

  describe("invalidateAllPages", () => {
    test("clears all cached pages", async () => {
      await initializeCache("user-1", "workspace-1");
      await cachePage({ ...PAGE, id: "page-1" });
      await cachePage({ ...PAGE, id: "page-2" });

      await invalidateAllPages();

      expect(await getCachedPageData("page-1")).toBeNull();
      expect(await getCachedPageData("page-2")).toBeNull();
    });
  });
});
