import { describe, expect, test, vi, beforeEach, afterEach } from "vitest";
import "fake-indexeddb/auto";
import { getWorkspaceThemes, createWorkspaceTheme } from "../workspaceThemes";
import { initializeCache, destroyCache, themesCache } from "../cache";
import { DEFAULT_THEME_VALUES } from "../themes";
import { THEME, DARK_THEME } from "@/test/fixtures/Theme";
import client from "@/api/client";

vi.mock("@/api/client", () => ({
  default: {
    themes: {
      list: {
        query: vi.fn(),
      },
      create: {
        mutate: vi.fn(),
      },
    },
  },
}));

// IDB returns items sorted by key (id), so order alphabetically
const mockThemesResponse = [DARK_THEME, THEME];

describe("workspaceThemes", () => {
  beforeEach(async () => {
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

  describe("createWorkspaceTheme", () => {
    test("creates a theme from the default values and caches it", async () => {
      const created = { ...THEME, id: "new-theme", name: "New theme" };
      vi.mocked(client.themes.create.mutate).mockResolvedValueOnce(created);

      const theme = await createWorkspaceTheme();

      expect(client.themes.create.mutate).toHaveBeenCalledWith({
        workspaceId: "workspace-123",
        name: "New theme",
        ...DEFAULT_THEME_VALUES,
      });
      expect(theme.serialize()).toEqual(created);
      expect(themesCache.getById("new-theme")).toBe(theme);
    });

    test("copies the values of the given theme", async () => {
      vi.mocked(client.themes.create.mutate).mockResolvedValueOnce({ ...DARK_THEME, id: "copy" });

      await createWorkspaceTheme(DARK_THEME);

      expect(client.themes.create.mutate).toHaveBeenCalledWith({
        workspaceId: "workspace-123",
        name: "New theme",
        background: DARK_THEME.background,
        colors: DARK_THEME.colors,
        fonts: DARK_THEME.fonts,
      });
    });
  });
});
