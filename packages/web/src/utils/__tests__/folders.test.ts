import { describe, expect, test, vi, beforeEach } from "vitest";
import {
  getCachedWorkspaceFolders,
  getWorkspaceFolders,
  invalidateWorkspaceFolders,
} from "../folders";
import { get, set, remove } from "../state";
import client from "@/api/client";

vi.mock("../state");
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

describe("getCachedWorkspaceFolders", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("returns cached value when present", () => {
    vi.mocked(get).mockReturnValueOnce(mockFoldersResponse);

    const result = getCachedWorkspaceFolders("workspace-123");

    expect(get).toHaveBeenCalledWith("folders:workspace-123");
    expect(result).toEqual(mockFoldersResponse);
  });

  test("returns null when cache is empty", () => {
    vi.mocked(get).mockReturnValueOnce(null);

    const result = getCachedWorkspaceFolders("workspace-123");

    expect(get).toHaveBeenCalledWith("folders:workspace-123");
    expect(result).toBeNull();
  });
});

describe("getWorkspaceFolders", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("returns cached value without fetching when cache exists", async () => {
    vi.mocked(get).mockReturnValueOnce(mockFoldersResponse);

    const result = await getWorkspaceFolders("workspace-123");

    expect(get).toHaveBeenCalledWith("folders:workspace-123");
    expect(client.folders.list.query).not.toHaveBeenCalled();
    expect(result).toEqual(mockFoldersResponse);
  });

  test("fetches and caches folders when cache is empty", async () => {
    vi.mocked(get).mockReturnValueOnce(null);
    vi.mocked(client.folders.list.query).mockResolvedValueOnce(
      mockFoldersResponse,
    );

    const result = await getWorkspaceFolders("workspace-123");

    expect(get).toHaveBeenCalledWith("folders:workspace-123");
    expect(client.folders.list.query).toHaveBeenCalledWith({
      workspaceId: "workspace-123",
    });
    expect(set).toHaveBeenCalledWith(
      "folders:workspace-123",
      mockFoldersResponse,
    );
    expect(result).toEqual(mockFoldersResponse);
  });
});

describe("invalidateWorkspaceFolders", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("removes the cached folder list", () => {
    invalidateWorkspaceFolders("workspace-123");

    expect(remove).toHaveBeenCalledWith("folders:workspace-123");
  });
});
