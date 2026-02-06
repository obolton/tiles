import { describe, expect, test, vi, beforeEach, afterEach } from "vitest";
import { getIsBookmarked, setIsBookmarked } from "../bookmarks";
import { initializeCache, destroyCache, getBookmarksStore } from "../cache";
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
  beforeEach(() => {
    vi.clearAllMocks();
    initializeCache("user-123", "workspace-123");
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
        pageId: "page-1",
      });
    });

    test("caches the bookmark state", async () => {
      await setIsBookmarked("page-1", true);

      const store = getBookmarksStore();
      const cached = await store.get("page-1");
      expect(cached).toBe(true);
    });

    test("updates the cached state when unbookmarking", async () => {
      await setIsBookmarked("page-1", true);
      await setIsBookmarked("page-1", false);

      const store = getBookmarksStore();
      const cached = await store.get("page-1");
      expect(cached).toBe(false);
    });
  });

  describe("getIsBookmarked", () => {
    test("returns cached value when present", async () => {
      const store = getBookmarksStore();
      await store.put(true, "page-1");

      const result = await getIsBookmarked("page-1");

      expect(result).toBe(true);
      expect(client.bookmarks.isBookmarked.query).not.toHaveBeenCalled();
    });

    test("fetches from API when cache is empty", async () => {
      vi.mocked(client.bookmarks.isBookmarked.query).mockResolvedValueOnce(
        true,
      );

      const result = await getIsBookmarked("page-1");

      expect(client.bookmarks.isBookmarked.query).toHaveBeenCalledWith({
        pageId: "page-1",
      });
      expect(result).toBe(true);
    });

    test("caches the API result", async () => {
      vi.mocked(client.bookmarks.isBookmarked.query).mockResolvedValueOnce(
        false,
      );

      await getIsBookmarked("page-1");

      const store = getBookmarksStore();
      const cached = await store.get("page-1");
      expect(cached).toBe(false);
    });

    test("returns false from API when not bookmarked", async () => {
      vi.mocked(client.bookmarks.isBookmarked.query).mockResolvedValueOnce(
        false,
      );

      const result = await getIsBookmarked("page-1");
      expect(result).toBe(false);
    });
  });
});
