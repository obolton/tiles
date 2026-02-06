import { describe, expect, test, beforeEach, afterEach } from "vitest";
import {
  initializeCache,
  isCacheInitialized,
  getWorkspaceId,
  getFoldersStore,
  getFoldersMetaStore,
  getBookmarksStore,
  destroyCache,
} from "../index";

describe("cache", () => {
  afterEach(async () => {
    await destroyCache();
  });

  describe("initializeCache", () => {
    test("initializes the cache database", () => {
      initializeCache("user-1", "workspace-1");
      expect(isCacheInitialized()).toBe(true);
    });

    test("throws if called twice", () => {
      initializeCache("user-1", "workspace-1");
      expect(() => initializeCache("user-1", "workspace-1")).toThrow(
        "Cache already initialized",
      );
    });
  });

  describe("isCacheInitialized", () => {
    test("returns false before initialization", () => {
      expect(isCacheInitialized()).toBe(false);
    });

    test("returns true after initialization", () => {
      initializeCache("user-1", "workspace-1");
      expect(isCacheInitialized()).toBe(true);
    });

    test("returns false after destroy", async () => {
      initializeCache("user-1", "workspace-1");
      await destroyCache();
      expect(isCacheInitialized()).toBe(false);
    });
  });

  describe("getWorkspaceId", () => {
    test("returns the workspace ID after initialization", () => {
      initializeCache("user-1", "workspace-123");
      expect(getWorkspaceId()).toBe("workspace-123");
    });

    test("throws if cache not initialized", () => {
      expect(() => getWorkspaceId()).toThrow(
        "Cache not initialized. Call initializeCache first.",
      );
    });
  });

  describe("getFoldersStore", () => {
    test("returns the folders store", () => {
      initializeCache("user-1", "workspace-1");
      const store = getFoldersStore();
      expect(store).toBeDefined();
    });

    test("throws if cache not initialized", () => {
      expect(() => getFoldersStore()).toThrow(
        "Cache not initialized. Call initializeCache first.",
      );
    });
  });

  describe("getFoldersMetaStore", () => {
    test("returns the folders meta store", () => {
      initializeCache("user-1", "workspace-1");
      const store = getFoldersMetaStore();
      expect(store).toBeDefined();
    });

    test("throws if cache not initialized", () => {
      expect(() => getFoldersMetaStore()).toThrow(
        "Cache not initialized. Call initializeCache first.",
      );
    });
  });

  describe("getBookmarksStore", () => {
    test("returns the bookmarks store", () => {
      initializeCache("user-1", "workspace-1");
      const store = getBookmarksStore();
      expect(store).toBeDefined();
    });

    test("throws if cache not initialized", () => {
      expect(() => getBookmarksStore()).toThrow(
        "Cache not initialized. Call initializeCache first.",
      );
    });
  });

  describe("destroyCache", () => {
    test("clears the cache state", async () => {
      initializeCache("user-1", "workspace-1");
      await destroyCache();

      expect(isCacheInitialized()).toBe(false);
      expect(() => getWorkspaceId()).toThrow();
    });

    test("allows reinitializing after destroy", async () => {
      initializeCache("user-1", "workspace-1");
      await destroyCache();

      initializeCache("user-2", "workspace-2");
      expect(getWorkspaceId()).toBe("workspace-2");
    });

    test("is idempotent when not initialized", async () => {
      await expect(destroyCache()).resolves.not.toThrow();
    });
  });

  describe("store operations", () => {
    beforeEach(() => {
      initializeCache("user-1", "workspace-1");
    });

    test("persists folders to IndexedDB", async () => {
      const store = getFoldersStore();

      await store.put({ id: "folder-1", name: "My Folder" });
      const result = await store.get("folder-1");

      expect(result).toEqual({ id: "folder-1", name: "My Folder" });
    });

    test("persists folders metadata to IndexedDB", async () => {
      const store = getFoldersMetaStore();
      const cachedAt = new Date();

      await store.put({ nextCursor: "cursor-123", cachedAt }, "meta");
      const result = await store.get("meta");

      expect(result).toEqual({ nextCursor: "cursor-123", cachedAt });
    });

    test("persists bookmarks to IndexedDB", async () => {
      const store = getBookmarksStore();

      await store.put(true, "page-1");
      const result = await store.get("page-1");

      expect(result).toBe(true);
    });
  });
});
