import { describe, expect, test, vi, beforeEach, afterEach } from "vitest";
import "fake-indexeddb/auto";
import {
  getCachedWorkspaceThemes,
  getWorkspaceThemes,
  invalidateWorkspaceThemes,
} from "../workspaceThemes";
import { initializeCache, destroyCache } from "../cache";
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
  beforeEach(() => {
    vi.clearAllMocks();
    initializeCache("user-123", "workspace-123");
  });

  afterEach(async () => {
    await destroyCache();
  });

  describe("getCachedWorkspaceThemes", () => {
    test("returns null when cache is empty", async () => {
      const result = await getCachedWorkspaceThemes();
      expect(result).toBeNull();
    });

    test("returns cached value when present and fresh", async () => {
      vi.mocked(client.themes.list.query).mockResolvedValueOnce(
        mockThemesResponse,
      );
      await getWorkspaceThemes();

      const result = await getCachedWorkspaceThemes();

      expect(result).toEqual(mockThemesResponse);
    });
  });

  describe("getWorkspaceThemes", () => {
    test("returns cached value without fetching when cache exists", async () => {
      vi.mocked(client.themes.list.query).mockResolvedValueOnce(
        mockThemesResponse,
      );
      await getWorkspaceThemes();

      vi.clearAllMocks();

      const result = await getWorkspaceThemes();

      expect(client.themes.list.query).not.toHaveBeenCalled();
      expect(result).toEqual(mockThemesResponse);
    });

    test("fetches and caches themes when cache is empty", async () => {
      vi.mocked(client.themes.list.query).mockResolvedValueOnce(
        mockThemesResponse,
      );

      const result = await getWorkspaceThemes();

      expect(client.themes.list.query).toHaveBeenCalledWith({
        workspaceId: "workspace-123",
      });
      expect(result).toEqual(mockThemesResponse);

      const cached = await getCachedWorkspaceThemes();
      expect(cached).toEqual(mockThemesResponse);
    });
  });

  describe("invalidateWorkspaceThemes", () => {
    test("removes the cached themes list", async () => {
      vi.mocked(client.themes.list.query).mockResolvedValueOnce(
        mockThemesResponse,
      );
      await getWorkspaceThemes();

      // Verify cache exists
      const beforeInvalidate = await getCachedWorkspaceThemes();
      expect(beforeInvalidate).not.toBeNull();

      // Invalidate
      await invalidateWorkspaceThemes();

      // Verify cache is cleared
      const afterInvalidate = await getCachedWorkspaceThemes();
      expect(afterInvalidate).toBeNull();
    });
  });
});
