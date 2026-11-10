import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { initRoute } from "../init";
import { user } from "@/utils/sessions";
import { destroyCache, foldersCache, getWorkspaceId, initializeCache } from "@/utils/cache";
import { getWorkspaceFolders } from "@/utils/folders";
import client from "@/api/client";

vi.mock("@/api/client", () => ({
  default: {
    users: { getUserInfo: { query: vi.fn() } },
    folders: { list: { query: vi.fn() } },
  },
}));

// The database is never opened in this file, so the collections stay as they are before a user
// is known.
vi.mock("@/utils/cache", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/utils/cache")>()),
  initializeCache: vi.fn(),
}));

const USER = {
  id: "user-1",
  name: "Alice",
  email: "alice@example.com",
  username: "alice",
  imageUrl: null,
  imageKey: null,
  workspaces: [{ id: "workspace-1", name: "Workspace 1" }],
};

const FOLDERS = { folders: [{ id: "folder-1", name: "Folder 1" }], nextCursor: null };

beforeEach(() => {
  vi.clearAllMocks();
  user.value = null;
  localStorage.clear();
  vi.spyOn(document, "cookie", "get").mockReturnValue("__Secure-signed-in=1");
  vi.spyOn(console, "warn").mockImplementation(() => {});
  vi.mocked(client.users.getUserInfo.query).mockResolvedValue(USER);
});

afterEach(async () => {
  await destroyCache();
  vi.restoreAllMocks();
});

describe("initRoute", () => {
  test("initializes the cache with the user provided by the route", () => {
    initRoute("workspace-1", USER);

    expect(getWorkspaceId()).toBe("workspace-1");
    expect(initializeCache).toHaveBeenCalledExactlyOnceWith("user-1", "workspace-1");
  });

  test("initializes the cache with the cached user", () => {
    localStorage.setItem("user", JSON.stringify(USER));

    initRoute("workspace-1");

    expect(getWorkspaceId()).toBe("workspace-1");
    expect(initializeCache).toHaveBeenCalledExactlyOnceWith("user-1", "workspace-1");
  });

  test("sets the workspace before the user arrives when none is cached", () => {
    initRoute("workspace-1");

    expect(user.value).toBeNull();
    expect(getWorkspaceId()).toBe("workspace-1");
    expect(initializeCache).not.toHaveBeenCalled();
  });

  test("serves workspace data from the network when no user is cached", async () => {
    vi.mocked(client.folders.list.query).mockResolvedValue(FOLDERS);

    initRoute("workspace-1");
    const result = await getWorkspaceFolders();

    expect(client.folders.list.query).toHaveBeenCalledExactlyOnceWith({
      workspaceId: "workspace-1",
    });
    expect(result).toEqual(FOLDERS);
    expect(foldersCache.items.value).toEqual(FOLDERS.folders);
  });

  test("does not fetch the user for a visitor who is not signed in", async () => {
    vi.spyOn(document, "cookie", "get").mockReturnValue("");

    initRoute("workspace-1");
    await Promise.resolve();

    expect(client.users.getUserInfo.query).not.toHaveBeenCalled();
    expect(initializeCache).not.toHaveBeenCalled();
  });

  test("leaves the workspace unset without one", () => {
    initRoute(undefined, USER);

    expect(() => getWorkspaceId()).toThrow("Workspace not set");
    expect(initializeCache).not.toHaveBeenCalled();
  });
});
