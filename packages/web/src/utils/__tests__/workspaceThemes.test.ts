import { describe, expect, test, vi, beforeEach, afterEach } from "vitest";
import "fake-indexeddb/auto";
import { getWorkspaceThemes, invalidateWorkspaceThemes } from "../workspaceThemes";
import { initializeCache, destroyCache, themesCache } from "../cache";
import { THEME, DARK_THEME } from "@/test/fixtures/Theme";
import client from "@/api/client";

vi.mock("@/api/client", () => ({
  default: {
    themes: {
      list: {
        query: vi.fn(),
      },
    },
  },
}));

// IDB returns items sorted by key (id), so order alphabetically
const mockThemesResponse = [DARK_THEME, THEME];

describe("workspaceThemes", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    await initializeCache("user-123", "workspace-123");
  });

  afterEach(async () => {
    await destroyCache();
  });

  describe("getWorkspaceThemes", () => {
    test("returns cached value without fetching when cache exists", async () => {
      vi.mocked(client.themes.list.query).mockResolvedValueOnce(mockThemesResponse);
      await getWorkspaceThemes();

      vi.clearAllMocks();

      const result = await getWorkspaceThemes();

      expect(client.themes.list.query).not.toHaveBeenCalled();
      expect(result.map((t) => t.serialize())).toEqual(mockThemesResponse);
    });

    test("fetches and caches themes when cache is empty", async () => {
      vi.mocked(client.themes.list.query).mockResolvedValueOnce(mockThemesResponse);

      const result = await getWorkspaceThemes();

      expect(client.themes.list.query).toHaveBeenCalledWith({
        workspaceId: "workspace-123",
      });
      expect(result.map((t) => t.serialize())).toEqual(mockThemesResponse);

      const cached = await themesCache.getCached();
      expect(cached?.items.map((t) => t.serialize())).toEqual(mockThemesResponse);
    });
  });

  describe("invalidateWorkspaceThemes", () => {
    test("removes the cached themes list", async () => {
      vi.mocked(client.themes.list.query).mockResolvedValueOnce(mockThemesResponse);
      await getWorkspaceThemes();

      // Verify cache exists
      const beforeInvalidate = await themesCache.getCached();
      expect(beforeInvalidate).not.toBeNull();

      // Invalidate
      await invalidateWorkspaceThemes();

      // Verify cache is cleared
      const afterInvalidate = await themesCache.getCached();
      expect(afterInvalidate).toBeNull();
    });
  });
});
