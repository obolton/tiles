import { describe, expect, test, vi, beforeEach, afterEach } from "vitest";
import "fake-indexeddb/auto";
import { Database } from "@/utils/idb";
import { CacheCollection } from "../collection";

interface TestItem {
  id: string;
  name: string;
}

const TTL_MS = 1000;

function createCollection() {
  return new CacheCollection<TestItem>({
    ttlMs: TTL_MS,
    itemsStoreName: "items",
    metaStoreName: "itemsMeta",
  });
}

function createDatabase(collection: CacheCollection<TestItem>) {
  return new Database({
    name: "test-cache",
    version: 1,
    schema: collection.schema,
  });
}

describe("CacheCollection", () => {
  let collection: CacheCollection<TestItem>;
  let db: Database<ReturnType<typeof createCollection>["schema"]>;

  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    collection = createCollection();
    db = createDatabase(collection);
    collection.initialize(db);
  });

  afterEach(async () => {
    vi.useRealTimers();
    await db.deleteDatabase();
  });

  describe("getCached", () => {
    test("returns null when cache is empty", async () => {
      const result = await collection.getCached();
      expect(result).toBeNull();
    });

    test("returns null when cache is stale", async () => {
      await collection.set([{ id: "1", name: "Test" }]);

      vi.setSystemTime(Date.now() + TTL_MS + 100);

      const result = await collection.getCached();
      expect(result).toBeNull();
    });

    test("returns items when cache is fresh", async () => {
      const items = [
        { id: "1", name: "First" },
        { id: "2", name: "Second" },
      ];
      await collection.set(items);

      const result = await collection.getCached();

      expect(result).not.toBeNull();
      expect(result?.items).toEqual(items);
    });

    test("populates reactive array and map", async () => {
      const items = [
        { id: "1", name: "First" },
        { id: "2", name: "Second" },
      ];
      await collection.set(items);

      // Create fresh collection to simulate page reload
      const newCollection = createCollection();
      newCollection.initialize(db);

      // Items array should be empty before getCached
      expect(newCollection.items.value).toHaveLength(0);
      expect(newCollection.getById("1")).toBeNull();

      // Load from cache
      await newCollection.getCached();

      // Now items should be populated
      expect(newCollection.items.value).toEqual(items);
      expect(newCollection.getById("1")).toEqual({ id: "1", name: "First" });
    });
  });

  describe("set", () => {
    test("persists items to IDB", async () => {
      const items = [{ id: "1", name: "Test" }];
      await collection.set(items);

      // Create fresh collection to verify persistence
      const newCollection = createCollection();
      newCollection.initialize(db);
      const cached = await newCollection.getCached();

      expect(cached?.items).toEqual(items);
    });

    test("updates reactive array", async () => {
      let notified = false;
      collection.items.subscribe(() => {
        notified = true;
      });

      await collection.set([{ id: "1", name: "Test" }]);

      expect(notified).toBe(true);
      expect(collection.items.value).toEqual([{ id: "1", name: "Test" }]);
    });

    test("replaces existing items", async () => {
      await collection.set([{ id: "1", name: "First" }]);
      await collection.set([{ id: "2", name: "Second" }]);

      const cached = await collection.getCached();

      expect(cached?.items).toEqual([{ id: "2", name: "Second" }]);
      expect(collection.getById("1")).toBeNull();
      expect(collection.getById("2")).toEqual({ id: "2", name: "Second" });
    });

    test("stores metadata with cachedAt timestamp", async () => {
      await collection.set([{ id: "1", name: "Test" }], { nextCursor: "abc" });

      expect(collection.meta).not.toBeNull();
      expect(collection.meta?.cachedAt).toBeInstanceOf(Date);
      expect(collection.meta?.nextCursor).toBe("abc");
    });
  });

  describe("append", () => {
    test("adds to existing items", async () => {
      await collection.set([{ id: "1", name: "First" }]);
      await collection.append([{ id: "2", name: "Second" }]);

      expect(collection.items.value).toHaveLength(2);
      expect(collection.getById("1")).toEqual({ id: "1", name: "First" });
      expect(collection.getById("2")).toEqual({ id: "2", name: "Second" });
    });

    test("updates metadata timestamp", async () => {
      await collection.set([{ id: "1", name: "First" }]);
      const firstTimestamp = collection.meta!.cachedAt.getTime();

      vi.setSystemTime(Date.now() + 100);

      await collection.append([{ id: "2", name: "Second" }], "new-cursor");

      expect(collection.meta?.cachedAt.getTime()).toBeGreaterThan(
        firstTimestamp,
      );
      expect(collection.meta?.nextCursor).toBe("new-cursor");
    });

    test("preserves existing cursor when not provided", async () => {
      await collection.set([{ id: "1", name: "First" }], {
        nextCursor: "original",
      });
      await collection.append([{ id: "2", name: "Second" }]);

      expect(collection.meta?.nextCursor).toBe("original");
    });

    test("updates map for duplicate IDs", async () => {
      await collection.set([{ id: "1", name: "Original" }]);
      await collection.append([{ id: "1", name: "Updated" }]);

      // Map returns the latest
      expect(collection.getById("1")).toEqual({ id: "1", name: "Updated" });
    });

    test("persists appended items to IDB", async () => {
      await collection.set([{ id: "1", name: "First" }]);
      await collection.append([{ id: "2", name: "Second" }]);

      // Verify in IDB
      const newCollection = createCollection();
      newCollection.initialize(db);
      const cached = await newCollection.getCached();

      expect(cached?.items).toHaveLength(2);
    });
  });

  describe("invalidate", () => {
    test("clears IDB", async () => {
      await collection.set([{ id: "1", name: "Test" }]);
      await collection.invalidate();

      // Fresh collection should find nothing
      const newCollection = createCollection();
      newCollection.initialize(db);
      const cached = await newCollection.getCached();

      expect(cached).toBeNull();
    });

    test("clears reactive state", async () => {
      await collection.set([{ id: "1", name: "Test" }]);
      await collection.invalidate();

      expect(collection.items.value).toHaveLength(0);
      expect(collection.meta).toBeNull();
      expect(collection.getById("1")).toBeNull();
    });

    test("notifies subscribers", async () => {
      await collection.set([{ id: "1", name: "Test" }]);

      let notified = false;
      collection.items.subscribe(() => {
        notified = true;
      });

      await collection.invalidate();

      expect(notified).toBe(true);
    });
  });

  describe("getById", () => {
    test("returns item from map", async () => {
      await collection.set([
        { id: "1", name: "First" },
        { id: "2", name: "Second" },
      ]);

      expect(collection.getById("1")).toEqual({ id: "1", name: "First" });
      expect(collection.getById("2")).toEqual({ id: "2", name: "Second" });
    });

    test("returns null for unknown id", async () => {
      await collection.set([{ id: "1", name: "Test" }]);

      expect(collection.getById("unknown")).toBeNull();
    });

    test("returns null when cache is empty", () => {
      expect(collection.getById("1")).toBeNull();
    });
  });

  describe("meta", () => {
    test("returns null before any data is set", () => {
      expect(collection.meta).toBeNull();
    });

    test("returns metadata after set", async () => {
      await collection.set([{ id: "1", name: "Test" }], { nextCursor: "abc" });

      expect(collection.meta).not.toBeNull();
      expect(collection.meta?.nextCursor).toBe("abc");
    });

    test("returns null after invalidate", async () => {
      await collection.set([{ id: "1", name: "Test" }]);
      await collection.invalidate();

      expect(collection.meta).toBeNull();
    });
  });

  describe("schema", () => {
    test("exposes schema for database creation", () => {
      const col = createCollection();

      expect(col.schema).toEqual({
        items: { keyPath: "id" },
        itemsMeta: {},
      });
    });
  });

  describe("count", () => {
    test("returns 0 when cache is empty", () => {
      expect(collection.count).toBe(0);
    });

    test("returns item count after set", async () => {
      await collection.set([
        { id: "1", name: "First" },
        { id: "2", name: "Second" },
      ]);

      expect(collection.count).toBe(2);
    });

    test("updates after append", async () => {
      await collection.set([{ id: "1", name: "First" }]);
      await collection.append([{ id: "2", name: "Second" }]);

      expect(collection.count).toBe(2);
    });

    test("updates after delete", async () => {
      await collection.set([
        { id: "1", name: "First" },
        { id: "2", name: "Second" },
      ]);
      await collection.delete(["1"]);

      expect(collection.count).toBe(1);
    });

    test("returns 0 after invalidate", async () => {
      await collection.set([{ id: "1", name: "Test" }]);
      await collection.invalidate();

      expect(collection.count).toBe(0);
    });
  });

  describe("isWarm", () => {
    test("returns false before any data is set", () => {
      expect(collection.isWarm).toBe(false);
    });

    test("returns true after set", async () => {
      await collection.set([{ id: "1", name: "Test" }]);
      expect(collection.isWarm).toBe(true);
    });

    test("returns true after set with empty array", async () => {
      await collection.set([]);
      expect(collection.isWarm).toBe(true);
    });

    test("returns true after append", async () => {
      await collection.append([{ id: "1", name: "Test" }]);
      expect(collection.isWarm).toBe(true);
    });

    test("returns true after getCached loads data", async () => {
      await collection.set([{ id: "1", name: "Test" }]);

      const newCollection = createCollection();
      newCollection.initialize(db);
      expect(newCollection.isWarm).toBe(false);

      await newCollection.getCached();
      expect(newCollection.isWarm).toBe(true);
    });

    test("returns false after invalidate", async () => {
      await collection.set([{ id: "1", name: "Test" }]);
      await collection.invalidate();
      expect(collection.isWarm).toBe(false);
    });
  });

  describe("delete", () => {
    test("removes single item from memory", async () => {
      await collection.set([
        { id: "1", name: "First" },
        { id: "2", name: "Second" },
      ]);

      await collection.delete(["1"]);

      expect(collection.items.value).toEqual([{ id: "2", name: "Second" }]);
      expect(collection.getById("1")).toBeNull();
      expect(collection.getById("2")).toEqual({ id: "2", name: "Second" });
    });

    test("removes multiple items from memory", async () => {
      await collection.set([
        { id: "1", name: "First" },
        { id: "2", name: "Second" },
        { id: "3", name: "Third" },
      ]);

      await collection.delete(["1", "3"]);

      expect(collection.items.value).toEqual([{ id: "2", name: "Second" }]);
    });

    test("persists deletion to IDB", async () => {
      await collection.set([
        { id: "1", name: "First" },
        { id: "2", name: "Second" },
      ]);

      await collection.delete(["1"]);

      const newCollection = createCollection();
      newCollection.initialize(db);
      const cached = await newCollection.getCached();

      expect(cached?.items).toEqual([{ id: "2", name: "Second" }]);
    });

    test("handles non-existent IDs gracefully", async () => {
      await collection.set([{ id: "1", name: "First" }]);

      await expect(collection.delete(["unknown"])).resolves.not.toThrow();
      expect(collection.items.value).toEqual([{ id: "1", name: "First" }]);
    });

    test("notifies subscribers", async () => {
      await collection.set([{ id: "1", name: "Test" }]);

      let notified = false;
      collection.items.subscribe(() => {
        notified = true;
      });

      await collection.delete(["1"]);

      expect(notified).toBe(true);
    });
  });

  describe("update", () => {
    test("updates item properties", async () => {
      await collection.set([{ id: "1", name: "Original" }]);

      const updated = await collection.update("1", { name: "Updated" });

      expect(updated).toEqual({ id: "1", name: "Updated" });
      expect(collection.getById("1")).toEqual({ id: "1", name: "Updated" });
      expect(collection.items.value).toEqual([{ id: "1", name: "Updated" }]);
    });

    test("returns null for non-existent ID", async () => {
      await collection.set([{ id: "1", name: "Test" }]);

      const result = await collection.update("unknown", { name: "Updated" });

      expect(result).toBeNull();
    });

    test("persists update to IDB", async () => {
      await collection.set([{ id: "1", name: "Original" }]);

      await collection.update("1", { name: "Updated" });

      const newCollection = createCollection();
      newCollection.initialize(db);
      const cached = await newCollection.getCached();

      expect(cached?.items).toEqual([{ id: "1", name: "Updated" }]);
    });

    test("notifies subscribers", async () => {
      await collection.set([{ id: "1", name: "Original" }]);

      let notified = false;
      collection.items.subscribe(() => {
        notified = true;
      });

      await collection.update("1", { name: "Updated" });

      expect(notified).toBe(true);
    });
  });

  describe("upsert", () => {
    test("updates existing item", async () => {
      await collection.set([{ id: "1", name: "Original" }]);

      await collection.upsert({ id: "1", name: "Updated" });

      expect(collection.items.value).toEqual([{ id: "1", name: "Updated" }]);
      expect(collection.getById("1")).toEqual({ id: "1", name: "Updated" });
    });

    test("inserts new item", async () => {
      await collection.set([{ id: "1", name: "First" }]);

      await collection.upsert({ id: "2", name: "Second" });

      expect(collection.items.value).toHaveLength(2);
      expect(collection.getById("2")).toEqual({ id: "2", name: "Second" });
    });

    test("preserves order when updating", async () => {
      await collection.set([
        { id: "1", name: "First" },
        { id: "2", name: "Second" },
        { id: "3", name: "Third" },
      ]);

      await collection.upsert({ id: "2", name: "Updated" });

      expect(collection.items.value).toEqual([
        { id: "1", name: "First" },
        { id: "2", name: "Updated" },
        { id: "3", name: "Third" },
      ]);
    });

    test("appends new items at end", async () => {
      await collection.set([{ id: "1", name: "First" }]);

      await collection.upsert({ id: "2", name: "Second" });

      expect(collection.items.value).toEqual([
        { id: "1", name: "First" },
        { id: "2", name: "Second" },
      ]);
    });

    test("persists to IDB", async () => {
      await collection.set([{ id: "1", name: "First" }]);

      await collection.upsert({ id: "2", name: "Second" });

      const newCollection = createCollection();
      newCollection.initialize(db);
      const cached = await newCollection.getCached();

      expect(cached?.items).toHaveLength(2);
    });

    test("notifies subscribers", async () => {
      await collection.set([{ id: "1", name: "Original" }]);

      let notified = false;
      collection.items.subscribe(() => {
        notified = true;
      });

      await collection.upsert({ id: "1", name: "Updated" });

      expect(notified).toBe(true);
    });
  });
});
