import { describe, expect, test, vi, beforeEach } from "vitest";
import {
  getCachedWorkspaceThemes,
  getWorkspaceThemes,
  invalidateWorkspaceThemes,
} from "../workspaceThemes";
import { THEME, DARK_THEME } from "@/test/fixtures/Theme";

vi.mock("@/api/client", () => ({
  default: {
    themes: {
      list: {
        query: vi.fn(),
      },
    },
  },
}));

vi.mock("../state", () => ({
  get: vi.fn(),
  set: vi.fn(),
  remove: vi.fn(),
}));

import client from "@/api/client";
import { get, set, remove } from "../state";

const WORKSPACE_ID = "workspace-id";
const MOCK_THEMES = [THEME, DARK_THEME];

describe("getCachedWorkspaceThemes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("returns cached themes", () => {
    vi.mocked(get).mockReturnValue(MOCK_THEMES);

    const result = getCachedWorkspaceThemes(WORKSPACE_ID);

    expect(get).toHaveBeenCalledWith("themes:workspace-id");
    expect(result).toEqual(MOCK_THEMES);
  });

  test("returns null when no cache", () => {
    vi.mocked(get).mockReturnValue(null);

    const result = getCachedWorkspaceThemes(WORKSPACE_ID);

    expect(result).toBeNull();
  });
});

describe("getWorkspaceThemes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("returns cached themes without API call", async () => {
    vi.mocked(get).mockReturnValue(MOCK_THEMES);

    const result = await getWorkspaceThemes(WORKSPACE_ID);

    expect(client.themes.list.query).not.toHaveBeenCalled();
    expect(result).toEqual(MOCK_THEMES);
  });

  test("fetches from API when no cache", async () => {
    vi.mocked(get).mockReturnValue(null);
    vi.mocked(client.themes.list.query).mockResolvedValue(MOCK_THEMES);

    const result = await getWorkspaceThemes(WORKSPACE_ID);

    expect(client.themes.list.query).toHaveBeenCalledWith({
      workspaceId: WORKSPACE_ID,
    });
    expect(set).toHaveBeenCalledWith("themes:workspace-id", MOCK_THEMES);
    expect(result).toEqual(MOCK_THEMES);
  });
});

describe("invalidateWorkspaceThemes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("removes themes from cache", () => {
    invalidateWorkspaceThemes(WORKSPACE_ID);

    expect(remove).toHaveBeenCalledWith("themes:workspace-id");
  });
});
