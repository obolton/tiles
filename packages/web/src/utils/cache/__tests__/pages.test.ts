import { describe, expect, test, afterEach } from "vitest";
import { PAGE } from "@/test/fixtures/Page";
import { TEXT_TILE, IMAGE_TILE, SECTION_TILE } from "@/test/fixtures/Tile";
import { initializeCache, destroyCache } from "../index";
import {
  cachePage,
  getCachedPageData,
  invalidateCachedPageData,
  invalidateAllPages,
} from "../pages";
import type { PageData } from "@/editor/Editor";

const page: PageData = {
  ...PAGE,
  tiles: [
    { ...TEXT_TILE, id: "tile-1", sectionId: null },
    { ...IMAGE_TILE, id: "tile-2", sectionId: null },
    { ...SECTION_TILE, id: "tile-3" },
  ],
};

describe("page cache", () => {
  afterEach(async () => {
    await destroyCache();
  });

  describe("cachePage", () => {
    test("stores page data", async () => {
      await initializeCache("user-1", "workspace-1");
      await cachePage(page);

      const cached = await getCachedPageData(page.id);
      expect(cached).not.toBeNull();
      expect(cached?.id).toBe(page.id);
      expect(cached?.title).toBe(page.title);
    });

    test("stores tiles separately from page properties", async () => {
      await initializeCache("user-1", "workspace-1");
      await cachePage(page);

      const cached = await getCachedPageData(page.id);
      expect(cached?.tiles).toHaveLength(3);
    });

    test("overwrites previously cached page data", async () => {
      await initializeCache("user-1", "workspace-1");
      await cachePage(page);

      const updated: PageData = { ...page, title: "Updated Title" };
      await cachePage(updated);

      const cached = await getCachedPageData(page.id);
      expect(cached?.title).toBe("Updated Title");
    });

    test("replaces tiles when re-caching", async () => {
      await initializeCache("user-1", "workspace-1");
      await cachePage(page);

      const updated: PageData = {
        ...page,
        tiles: [{ ...TEXT_TILE, id: "tile-new", sectionId: null }],
      };
      await cachePage(updated);

      const cached = await getCachedPageData(page.id);
      expect(cached?.tiles).toHaveLength(1);
      expect(cached?.tiles[0]?.id).toBe("tile-new");
    });
  });

  describe("getCachedPageData", () => {
    test("returns null for uncached page", async () => {
      await initializeCache("user-1", "workspace-1");
      const cached = await getCachedPageData("nonexistent");
      expect(cached).toBeNull();
    });

    test("reconstructs full PageData with tiles", async () => {
      await initializeCache("user-1", "workspace-1");
      await cachePage(page);

      const cached = await getCachedPageData(page.id);

      expect(cached).not.toBeNull();
      expect(cached?.id).toBe(page.id);
      expect(cached?.workspaceId).toBe(page.workspaceId);
      expect(cached?.title).toBe(page.title);
      expect(cached?.tiles).toHaveLength(3);
    });

    test("preserves tile properties", async () => {
      await initializeCache("user-1", "workspace-1");
      await cachePage(page);

      const cached = await getCachedPageData(page.id);
      const textTile = cached?.tiles.find((t) => t.id === "tile-1");

      expect(textTile).toBeDefined();
      expect(textTile?.type).toBe("TEXT");
      expect(textTile?.sectionId).toBeNull();
    });

    test("strips pageId from returned tiles", async () => {
      await initializeCache("user-1", "workspace-1");
      await cachePage(page);

      const cached = await getCachedPageData(page.id);
      for (const tile of cached?.tiles ?? []) {
        expect(tile).not.toHaveProperty("pageId");
      }
    });

    test("returns page with empty tiles array when page has no tiles", async () => {
      await initializeCache("user-1", "workspace-1");
      await cachePage({ ...PAGE, tiles: [] });

      const cached = await getCachedPageData(PAGE.id);
      expect(cached?.tiles).toEqual([]);
    });

    test("isolates tiles between pages", async () => {
      await initializeCache("user-1", "workspace-1");

      const page1: PageData = {
        ...page,
        id: "page-1",
        tiles: [{ ...TEXT_TILE, id: "tile-a", sectionId: null }],
      };
      const page2: PageData = {
        ...page,
        id: "page-2",
        tiles: [
          { ...TEXT_TILE, id: "tile-b", sectionId: null },
          { ...IMAGE_TILE, id: "tile-c", sectionId: null },
        ],
      };

      await cachePage(page1);
      await cachePage(page2);

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
      await cachePage(page);

      await invalidateCachedPageData(page.id);

      const cached = await getCachedPageData(page.id);
      expect(cached).toBeNull();
    });

    test("removes tiles for the invalidated page", async () => {
      await initializeCache("user-1", "workspace-1");

      const page1: PageData = {
        ...page,
        id: "page-1",
        tiles: [{ ...TEXT_TILE, id: "tile-a", sectionId: null }],
      };
      const page2: PageData = {
        ...page,
        id: "page-2",
        tiles: [{ ...TEXT_TILE, id: "tile-b", sectionId: null }],
      };

      await cachePage(page1);
      await cachePage(page2);

      await invalidateCachedPageData("page-1");

      const cached1 = await getCachedPageData("page-1");
      const cached2 = await getCachedPageData("page-2");
      expect(cached1).toBeNull();
      expect(cached2?.tiles).toHaveLength(1);
    });

    test("is safe to call for nonexistent page", async () => {
      await initializeCache("user-1", "workspace-1");
      await expect(
        invalidateCachedPageData("nonexistent"),
      ).resolves.not.toThrow();
    });
  });

  describe("invalidateAllPages", () => {
    test("clears all cached pages", async () => {
      await initializeCache("user-1", "workspace-1");

      await cachePage({ ...page, id: "page-1" });
      await cachePage({ ...page, id: "page-2" });

      await invalidateAllPages();

      expect(await getCachedPageData("page-1")).toBeNull();
      expect(await getCachedPageData("page-2")).toBeNull();
    });
  });
});
