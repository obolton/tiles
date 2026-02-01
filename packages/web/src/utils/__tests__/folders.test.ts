import { describe, expect, test, vi, beforeEach, afterEach } from "vitest";
import "fake-indexeddb/auto";
import { getWorkspaceFolders, invalidateWorkspaceFolders } from "../folders";
import { initializeCache, destroyCache, foldersCache } from "../cache";
import client from "@/api/client";

vi.mock("@/api/client", () => ({
  default: {
    folders: {
      list: {
        query: vi.fn(),
      },
    },
  },
}));

const mockFoldersResponse = {
  folders: [
    { id: "folder-1", name: "Folder 1" },
    { id: "folder-2", name: "Folder 2" },
  ],
  nextCursor: null,
};

describe("folders", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    await initializeCache("user-123", "workspace-123");
  });

  afterEach(async () => {
    await destroyCache();
  });

  describe("getWorkspaceFolders", () => {
    test("returns cached value without fetching when cache exists", async () => {
      // First call to populate cache
      vi.mocked(client.folders.list.query).mockResolvedValueOnce(
        mockFoldersResponse,
      );
      await getWorkspaceFolders();

      vi.clearAllMocks();

      // Second call should use cache
      const result = await getWorkspaceFolders();

      expect(client.folders.list.query).not.toHaveBeenCalled();
      expect(result).toEqual(mockFoldersResponse);
    });

    test("fetches and caches folders when cache is empty", async () => {
      vi.mocked(client.folders.list.query).mockResolvedValueOnce(
        mockFoldersResponse,
      );

      const result = await getWorkspaceFolders();

      expect(client.folders.list.query).toHaveBeenCalledWith({
        workspaceId: "workspace-123",
      });
      expect(result).toEqual(mockFoldersResponse);

      // Verify it was cached
      const cached = await foldersCache.getCached();
      expect(cached?.items).toEqual(mockFoldersResponse.folders);
    });
  });

  describe("invalidateWorkspaceFolders", () => {
    test("removes the cached folder list", async () => {
      // Populate cache
      vi.mocked(client.folders.list.query).mockResolvedValueOnce(
        mockFoldersResponse,
      );
      await getWorkspaceFolders();

      // Verify cache exists
      const beforeInvalidate = await foldersCache.getCached();
      expect(beforeInvalidate).not.toBeNull();

      // Invalidate
      await invalidateWorkspaceFolders();

      // Verify cache is cleared
      const afterInvalidate = await foldersCache.getCached();
      expect(afterInvalidate).toBeNull();
    });
  });
});
