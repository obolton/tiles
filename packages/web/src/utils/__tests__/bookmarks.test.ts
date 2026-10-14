import { describe, expect, test, vi, beforeEach, afterEach } from "vitest";
import { getIsBookmarked, setIsBookmarked } from "../bookmarks";
import { initializeCache, destroyCache, bookmarksCache } from "../cache";
import client from "@/api/client";

vi.mock("@/api/client", () => ({
  default: {
    bookmarks: {
      create: { mutate: vi.fn() },
      delete: { mutate: vi.fn() },
      isBookmarked: { query: vi.fn() },
    },
  },
}));

describe("bookmarks", () => {
  beforeEach(async () => {
    await initializeCache("user-123", "workspace-123");
  });

  afterEach(async () => {
    await destroyCache();
  });

  describe("setIsBookmarked", () => {
    test("calls create API when bookmarking", async () => {
      await setIsBookmarked("page-1", true);
      expect(client.bookmarks.create.mutate).toHaveBeenCalledWith({
        pageId: "page-1",
      });
    });

    test("calls delete API when unbookmarking", async () => {
      await setIsBookmarked("page-1", false);
      expect(client.bookmarks.delete.mutate).toHaveBeenCalledWith({
        pageIds: ["page-1"],
      });
    });

    test("caches the bookmark in memory", async () => {
      await setIsBookmarked("page-1", true);

      expect(bookmarksCache.getById("page-1")).toEqual({ id: "page-1" });
    });

    test("removes from cache when unbookmarking", async () => {
      await setIsBookmarked("page-1", true);
      await setIsBookmarked("page-1", false);

      expect(bookmarksCache.getById("page-1")).toBeNull();
    });
  });

  describe("getIsBookmarked", () => {
    test("returns true when bookmark exists in cache", async () => {
      await setIsBookmarked("page-1", true);

      const result = await getIsBookmarked("page-1");

      expect(result).toBe(true);
      expect(client.bookmarks.isBookmarked.query).not.toHaveBeenCalled();
    });

    test("returns false when cache is populated but bookmark not found", async () => {
      // Populate cache with a different bookmark
      await setIsBookmarked("page-other", true);

      const result = await getIsBookmarked("page-1");

      expect(result).toBe(false);
      expect(client.bookmarks.isBookmarked.query).not.toHaveBeenCalled();
    });

    test("fetches from API when cache is empty", async () => {
      vi.mocked(client.bookmarks.isBookmarked.query).mockResolvedValueOnce(true);

      const result = await getIsBookmarked("page-1");

      expect(client.bookmarks.isBookmarked.query).toHaveBeenCalledWith({
        pageId: "page-1",
      });
      expect(result).toBe(true);
    });

    test("caches API result when bookmarked", async () => {
      vi.mocked(client.bookmarks.isBookmarked.query).mockResolvedValueOnce(true);

      await getIsBookmarked("page-1");

      expect(bookmarksCache.getById("page-1")).toEqual({ id: "page-1" });
    });

    test("returns false from API when not bookmarked", async () => {
      vi.mocked(client.bookmarks.isBookmarked.query).mockResolvedValueOnce(false);

      const result = await getIsBookmarked("page-1");
      expect(result).toBe(false);
    });
  });
});
