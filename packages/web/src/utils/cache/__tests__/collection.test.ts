import { describe, expect, test, vi, beforeEach, afterEach } from "vitest";
import "fake-indexeddb/auto";
import { Database } from "@/utils/idb";
import { CacheCollection } from "../collection";

interface TestItem {
  id: string;
  name: string;
}

interface TestItemRaw {
  id: string;
  name: string;
  count: number;
}

class TestModel {
  readonly id: string;
  name: string;
  count: number;

  constructor(data: TestItemRaw) {
    this.id = data.id;
    this.name = data.name;
    this.count = data.count;
  }
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

describe("CacheCollection without a database", () => {
  beforeEach(() => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  test("reports nothing cached", async () => {
    const collection = createCollection();
    await collection.set([{ id: "1", name: "Test" }]);

    expect(await collection.getCached()).toBeNull();
  });

  test("keeps items in memory", async () => {
    const collection = createCollection();

    await collection.set([{ id: "1", name: "First" }]);
    await collection.upsert({ id: "2", name: "Second" });
    await collection.delete(["1"]);

    expect(collection.items.value).toEqual([{ id: "2", name: "Second" }]);
    expect(collection.getById("2")).toEqual({ id: "2", name: "Second" });
  });
});

describe("CacheCollection", () => {
  let collection: CacheCollection<TestItem>;
  let db: Database<ReturnType<typeof createCollection>["schema"]>;

  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["Date"] });
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

      const cached = await collection.getCached();

      expect(cached?.meta.cachedAt.getTime()).toBe(Date.now());
      expect(cached?.meta.nextCursor).toBe("abc");
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
      const firstTimestamp = Date.now();

      vi.setSystemTime(firstTimestamp + 100);

      await collection.append([{ id: "2", name: "Second" }], "new-cursor");
      const cached = await collection.getCached();

      expect(cached?.meta.cachedAt.getTime()).toBeGreaterThan(firstTimestamp);
      expect(cached?.meta.nextCursor).toBe("new-cursor");
    });

    test("preserves existing cursor when not provided", async () => {
      await collection.set([{ id: "1", name: "First" }], {
        nextCursor: "original",
      });
      await collection.append([{ id: "2", name: "Second" }]);
      const cached = await collection.getCached();

      expect(cached?.meta.nextCursor).toBe("original");
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
      expect(collection.isWarm).toBe(false);
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

  describe("schema", () => {
    test("exposes schema for database creation", () => {
      const col = createCollection();

      expect(col.schema).toEqual({
        items: { keyPath: "id" },
        itemsMeta: {},
      });
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

  describe("serialize/deserialize", () => {
    let transformCollection: CacheCollection<TestItemRaw, TestModel>;
    let transformDb: Database<ReturnType<typeof createTransformCollection>["schema"]>;

    function createTransformCollection() {
      return new CacheCollection<TestItemRaw, TestModel>({
        ttlMs: TTL_MS,
        itemsStoreName: "transformItems",
        metaStoreName: "transformItemsMeta",
        serialize: (model) => ({
          id: model.id,
          name: model.name,
          count: model.count,
        }),
        deserialize: (raw) => new TestModel(raw),
      });
    }

    beforeEach(() => {
      transformCollection = createTransformCollection();
      transformDb = new Database({
        name: "test-cache-transform",
        version: 1,
        schema: transformCollection.schema,
      });
      transformCollection.initialize(transformDb);
    });

    afterEach(async () => {
      await transformDb.deleteDatabase();
    });

    test("set stores model instances in memory", async () => {
      await transformCollection.set([new TestModel({ id: "1", name: "Test", count: 5 })]);

      expect(transformCollection.items.value[0]).toBeInstanceOf(TestModel);
      expect(transformCollection.items.value[0]?.name).toBe("Test");
      expect(transformCollection.getById("1")).toBeInstanceOf(TestModel);
    });

    test("set persists raw form to IDB and getCached deserializes", async () => {
      await transformCollection.set([new TestModel({ id: "1", name: "Test", count: 5 })]);

      const freshCollection = createTransformCollection();
      freshCollection.initialize(transformDb);
      const cached = await freshCollection.getCached();

      expect(cached?.items).toHaveLength(1);
      expect(cached?.items[0]).toBeInstanceOf(TestModel);
      expect(cached?.items[0]?.name).toBe("Test");
      expect(cached?.items[0]?.count).toBe(5);
      expect(freshCollection.getById("1")).toBeInstanceOf(TestModel);
    });

    test("append stores model instances in memory and IDB", async () => {
      await transformCollection.set([new TestModel({ id: "1", name: "First", count: 1 })]);
      await transformCollection.append([new TestModel({ id: "2", name: "Second", count: 2 })]);

      expect(transformCollection.items.value).toHaveLength(2);
      expect(transformCollection.items.value[1]).toBeInstanceOf(TestModel);
      expect(transformCollection.getById("2")?.name).toBe("Second");

      const freshCollection = createTransformCollection();
      freshCollection.initialize(transformDb);
      const cached = await freshCollection.getCached();

      expect(cached?.items).toHaveLength(2);
      expect(cached?.items[1]).toBeInstanceOf(TestModel);
    });

    test("upsert inserts model instance", async () => {
      await transformCollection.set([new TestModel({ id: "1", name: "First", count: 1 })]);
      await transformCollection.upsert(new TestModel({ id: "2", name: "Second", count: 2 }));

      expect(transformCollection.items.value).toHaveLength(2);
      expect(transformCollection.getById("2")).toBeInstanceOf(TestModel);
    });

    test("upsert updates existing model instance", async () => {
      await transformCollection.set([new TestModel({ id: "1", name: "Original", count: 1 })]);
      await transformCollection.upsert(new TestModel({ id: "1", name: "Updated", count: 10 }));

      expect(transformCollection.items.value).toHaveLength(1);
      expect(transformCollection.items.value[0]).toBeInstanceOf(TestModel);
      expect(transformCollection.items.value[0]?.name).toBe("Updated");
      expect(transformCollection.items.value[0]?.count).toBe(10);
    });

    test("delete preserves remaining model instances", async () => {
      await transformCollection.set([
        new TestModel({ id: "1", name: "First", count: 1 }),
        new TestModel({ id: "2", name: "Second", count: 2 }),
      ]);

      await transformCollection.delete(["1"]);

      expect(transformCollection.items.value).toHaveLength(1);
      expect(transformCollection.items.value[0]).toBeInstanceOf(TestModel);
      expect(transformCollection.items.value[0]?.name).toBe("Second");
    });

    test("invalidate clears all model instances", async () => {
      await transformCollection.set([new TestModel({ id: "1", name: "Test", count: 1 })]);

      await transformCollection.invalidate();

      expect(transformCollection.items.value).toHaveLength(0);
      expect(transformCollection.getById("1")).toBeNull();
      expect(transformCollection.isWarm).toBe(false);
    });
  });
});
