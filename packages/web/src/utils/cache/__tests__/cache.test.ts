import { describe, expect, test, afterEach } from "vitest";
import Theme from "@/models/Theme";
import {
  initializeCache,
  setWorkspaceId,
  getWorkspaceId,
  destroyCache,
  usersCache,
  foldersCache,
  themesCache,
  bookmarksCache,
} from "../index";

describe("cache", () => {
  afterEach(async () => {
    await destroyCache();
  });

  describe("initializeCache", () => {
    test("initializes the cache database", async () => {
      await initializeCache("user-1", "workspace-1");
      expect(getWorkspaceId()).toBe("workspace-1");
    });

    test("is idempotent for same workspace", async () => {
      await initializeCache("user-1", "workspace-1");
      await bookmarksCache.set([{ id: "page-1" }]);

      await initializeCache("user-1", "workspace-1");

      expect(getWorkspaceId()).toBe("workspace-1");
      expect(bookmarksCache.isWarm).toBe(true);
    });

    test("switches workspace automatically", async () => {
      await initializeCache("user-1", "workspace-1");
      await bookmarksCache.set([{ id: "page-1" }]);

      await initializeCache("user-1", "workspace-2");

      expect(getWorkspaceId()).toBe("workspace-2");
      // Old cache data should be cleared
      expect(bookmarksCache.isWarm).toBe(false);
    });

    test("switches workspace when the workspace ID is set first", async () => {
      await initializeCache("user-1", "workspace-1");
      await bookmarksCache.set([{ id: "page-1" }]);

      setWorkspaceId("workspace-2");
      await initializeCache("user-1", "workspace-2");

      expect(getWorkspaceId()).toBe("workspace-2");
      expect(bookmarksCache.isWarm).toBe(false);
    });
  });

  describe("getWorkspaceId", () => {
    test("returns the workspace ID after initialization", async () => {
      await initializeCache("user-1", "workspace-123");
      expect(getWorkspaceId()).toBe("workspace-123");
    });

    test("throws if the workspace is not set", () => {
      expect(() => getWorkspaceId()).toThrow("Workspace not set");
    });
  });

  describe("setWorkspaceId", () => {
    test("sets the workspace ID without initializing the database", () => {
      setWorkspaceId("workspace-123");

      expect(getWorkspaceId()).toBe("workspace-123");
    });
  });

  describe("destroyCache", () => {
    test("clears the cache state", async () => {
      await initializeCache("user-1", "workspace-1");
      await destroyCache();

      expect(() => getWorkspaceId()).toThrow("Workspace not set");
    });

    test("allows reinitializing after destroy", async () => {
      await initializeCache("user-1", "workspace-1");
      await destroyCache();

      await initializeCache("user-2", "workspace-2");
      expect(getWorkspaceId()).toBe("workspace-2");
    });

    test("is idempotent when not initialized", async () => {
      await expect(destroyCache()).resolves.not.toThrow();
    });

    test("clears a workspace set without a database", async () => {
      setWorkspaceId("workspace-1");
      await destroyCache();

      expect(() => getWorkspaceId()).toThrow("Workspace not set");
    });
  });

  describe("cache collections", () => {
    test("usersCache is accessible after initialization", async () => {
      await initializeCache("user-1", "workspace-1");

      await usersCache.set([
        {
          id: "user-1",
          name: "Alice",
          email: "alice@test.com",
          imageUrl: null,
        },
      ]);
      const cached = await usersCache.getCached();

      expect(cached).not.toBeNull();
      expect(cached?.items).toHaveLength(1);
      expect(cached?.items[0]?.name).toBe("Alice");
    });

    test("foldersCache is accessible after initialization", async () => {
      await initializeCache("user-1", "workspace-1");

      await foldersCache.set([{ id: "folder-1", name: "My Folder" }]);
      const cached = await foldersCache.getCached();

      expect(cached).not.toBeNull();
      expect(cached?.items).toHaveLength(1);
      expect(cached?.items[0]?.name).toBe("My Folder");
    });

    test("themesCache is accessible after initialization", async () => {
      await initializeCache("user-1", "workspace-1");

      await themesCache.set([
        new Theme({
          id: "theme-1",
          workspaceId: "workspace-1",
          name: "Test Theme",
          background: { type: "color", color: "ffffffffffff" },
          colors: { text: "000000", accent: "0000ff" },
          fonts: { heading: "inter", body: "inter", code: "jetbrains-mono" },
        }),
      ]);
      const cached = await themesCache.getCached();

      expect(cached).not.toBeNull();
      expect(cached?.items).toHaveLength(1);
      expect(cached?.items[0]?.data.value.name).toBe("Test Theme");
    });

    test("bookmarksCache is accessible after initialization", async () => {
      await initializeCache("user-1", "workspace-1");

      await bookmarksCache.set([{ id: "page-1" }]);
      const cached = await bookmarksCache.getCached();

      expect(cached).not.toBeNull();
      expect(cached?.items).toHaveLength(1);
      expect(cached?.items[0]?.id).toBe("page-1");
    });
  });
});
