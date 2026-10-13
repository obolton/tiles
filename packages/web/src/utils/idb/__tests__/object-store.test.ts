import { describe, expect, test, beforeEach, afterEach } from "vitest";
import { Database } from "../database";
import { toPromise } from "../utils";

interface Item {
  id: string;
  name: string;
  value: number;
}

const schema = {
  items: {
    keyPath: "id",
    indexes: {
      byName: { keyPath: "name" },
      byValue: { keyPath: "value" },
    },
  },
} as const;

async function readFromIdb(idb: IDBDatabase, storeName: string, key: IDBValidKey) {
  const tx = idb.transaction(storeName, "readonly");
  const store = tx.objectStore(storeName);
  return toPromise(store.get(key));
}

async function readAllFromIdb(idb: IDBDatabase, storeName: string) {
  const tx = idb.transaction(storeName, "readonly");
  const store = tx.objectStore(storeName);
  return toPromise(store.getAll());
}

async function writeToIdb(idb: IDBDatabase, storeName: string, value: unknown) {
  const tx = idb.transaction(storeName, "readwrite");
  const store = tx.objectStore(storeName);
  return toPromise(store.put(value));
}

describe("ObjectStore", () => {
  let db: Database<typeof schema>;
  let idb: IDBDatabase;

  beforeEach(async () => {
    db = new Database({
      name: "test-db",
      version: 1,
      schema,
    });
    idb = await db.open();
  });

  afterEach(async () => {
    await db.deleteDatabase();
  });

  describe("put", () => {
    test("persists records to IndexedDB", async () => {
      const store = db.store<Item>("items");
      await store.put({ id: "1", name: "test", value: 42 });

      // Verify directly in IndexedDB
      const result = await readFromIdb(idb, "items", "1");
      expect(result).toEqual({ id: "1", name: "test", value: 42 });
    });

    test("updates an existing record in IndexedDB", async () => {
      const store = db.store<Item>("items");
      await store.put({ id: "1", name: "original", value: 1 });
      await store.put({ id: "1", name: "updated", value: 2 });

      const result = await readFromIdb(idb, "items", "1");
      expect(result).toEqual({ id: "1", name: "updated", value: 2 });
    });
  });

  describe("get", () => {
    test("retrieves records from IndexedDB", async () => {
      // Write directly to IndexedDB
      await writeToIdb(idb, "items", { id: "1", name: "test", value: 42 });

      const store = db.store<Item>("items");
      const result = await store.get("1");
      expect(result).toEqual({ id: "1", name: "test", value: 42 });
    });

    test("returns undefined for non-existent key", async () => {
      const store = db.store<Item>("items");
      const result = await store.get("nonexistent");
      expect(result).toBeUndefined();
    });
  });

  describe("add", () => {
    test("persists a new record to IndexedDB", async () => {
      const store = db.store<Item>("items");
      await store.add({ id: "1", name: "test", value: 42 });

      const result = await readFromIdb(idb, "items", "1");
      expect(result).toEqual({ id: "1", name: "test", value: 42 });
    });

    test("throws if key already exists", async () => {
      await writeToIdb(idb, "items", { id: "1", name: "existing", value: 1 });

      const store = db.store<Item>("items");
      await expect(store.add({ id: "1", name: "new", value: 2 })).rejects.toThrow(
        "constraint was not satisfied",
      );
    });
  });

  describe("has", () => {
    test("returns true if record exists in IndexedDB", async () => {
      await writeToIdb(idb, "items", { id: "1", name: "test", value: 42 });

      const store = db.store<Item>("items");
      expect(await store.has("1")).toBe(true);
    });

    test("returns false if record does not exist", async () => {
      const store = db.store<Item>("items");
      expect(await store.has("nonexistent")).toBe(false);
    });
  });

  describe("getAll", () => {
    test("retrieves all records from IndexedDB", async () => {
      await writeToIdb(idb, "items", { id: "1", name: "a", value: 1 });
      await writeToIdb(idb, "items", { id: "2", name: "b", value: 2 });

      const store = db.store<Item>("items");
      const results = await store.getAll();
      expect(results).toHaveLength(2);
    });

    test("returns empty array for empty store", async () => {
      const store = db.store<Item>("items");
      const results = await store.getAll();
      expect(results).toEqual([]);
    });

    test("respects count limit", async () => {
      await writeToIdb(idb, "items", { id: "1", name: "a", value: 1 });
      await writeToIdb(idb, "items", { id: "2", name: "b", value: 2 });
      await writeToIdb(idb, "items", { id: "3", name: "c", value: 3 });

      const store = db.store<Item>("items");
      const results = await store.getAll(undefined, 2);
      expect(results).toHaveLength(2);
    });
  });

  describe("getKeys", () => {
    test("returns all keys from IndexedDB", async () => {
      await writeToIdb(idb, "items", { id: "1", name: "a", value: 1 });
      await writeToIdb(idb, "items", { id: "2", name: "b", value: 2 });

      const store = db.store<Item>("items");
      const keys = await store.getKeys();
      expect(keys.sort()).toEqual(["1", "2"]);
    });
  });

  describe("delete", () => {
    test("removes a record from IndexedDB", async () => {
      await writeToIdb(idb, "items", { id: "1", name: "test", value: 42 });

      const store = db.store<Item>("items");
      await store.delete("1");

      const result = await readFromIdb(idb, "items", "1");
      expect(result).toBeUndefined();
    });

    test("does not throw for non-existent key", async () => {
      const store = db.store<Item>("items");
      await expect(store.delete("nonexistent")).resolves.not.toThrow();
    });
  });

  describe("clear", () => {
    test("removes all records from IndexedDB", async () => {
      await writeToIdb(idb, "items", { id: "1", name: "a", value: 1 });
      await writeToIdb(idb, "items", { id: "2", name: "b", value: 2 });

      const store = db.store<Item>("items");
      await store.clear();

      const results = await readAllFromIdb(idb, "items");
      expect(results).toHaveLength(0);
    });
  });

  describe("count", () => {
    test("returns the number of records in IndexedDB", async () => {
      await writeToIdb(idb, "items", { id: "1", name: "a", value: 1 });
      await writeToIdb(idb, "items", { id: "2", name: "b", value: 2 });

      const store = db.store<Item>("items");
      expect(await store.count()).toBe(2);
    });
  });

  describe("getByIndex", () => {
    test("retrieves a record by index value from IndexedDB", async () => {
      await writeToIdb(idb, "items", { id: "1", name: "alice", value: 1 });
      await writeToIdb(idb, "items", { id: "2", name: "bob", value: 2 });

      const store = db.store<Item>("items");
      const result = await store.getByIndex("byName", "bob");
      expect(result).toEqual({ id: "2", name: "bob", value: 2 });
    });

    test("returns undefined if not found", async () => {
      const store = db.store<Item>("items");
      const result = await store.getByIndex("byName", "nonexistent");
      expect(result).toBeUndefined();
    });
  });

  describe("getAllByIndex", () => {
    test("retrieves all records matching an index value", async () => {
      await writeToIdb(idb, "items", { id: "1", name: "alice", value: 1 });
      await writeToIdb(idb, "items", { id: "2", name: "bob", value: 2 });
      await writeToIdb(idb, "items", { id: "3", name: "alice", value: 3 });

      const store = db.store<Item>("items");
      const results = await store.getAllByIndex("byName", "alice");
      expect(results).toHaveLength(2);
      expect(results.every((r) => r.name === "alice")).toBe(true);
    });
  });

  describe("countByIndex", () => {
    test("counts records matching an index value", async () => {
      await writeToIdb(idb, "items", { id: "1", name: "alice", value: 1 });
      await writeToIdb(idb, "items", { id: "2", name: "bob", value: 2 });
      await writeToIdb(idb, "items", { id: "3", name: "alice", value: 3 });

      const store = db.store<Item>("items");
      expect(await store.countByIndex("byName", "alice")).toBe(2);
      expect(await store.countByIndex("byName", "bob")).toBe(1);
    });
  });

  describe("putMany", () => {
    test("persists multiple records to IndexedDB", async () => {
      const store = db.store<Item>("items");
      await store.putMany([
        { id: "1", name: "a", value: 1 },
        { id: "2", name: "b", value: 2 },
        { id: "3", name: "c", value: 3 },
      ]);

      const results = await readAllFromIdb(idb, "items");
      expect(results).toHaveLength(3);
    });
  });

  describe("deleteMany", () => {
    test("removes multiple records from IndexedDB", async () => {
      await writeToIdb(idb, "items", { id: "1", name: "a", value: 1 });
      await writeToIdb(idb, "items", { id: "2", name: "b", value: 2 });
      await writeToIdb(idb, "items", { id: "3", name: "c", value: 3 });

      const store = db.store<Item>("items");
      await store.deleteMany(["1", "3"]);

      const results = await readAllFromIdb(idb, "items");
      expect(results).toHaveLength(1);
      expect(results[0]).toEqual({ id: "2", name: "b", value: 2 });
    });
  });

  describe("query", () => {
    test("returns all records", async () => {
      await writeToIdb(idb, "items", { id: "1", name: "a", value: 1 });
      await writeToIdb(idb, "items", { id: "2", name: "b", value: 2 });
      await writeToIdb(idb, "items", { id: "3", name: "c", value: 3 });

      const store = db.store<Item>("items");
      const results = await store.query();
      expect(results).toHaveLength(3);
    });

    test("respects limit option", async () => {
      await writeToIdb(idb, "items", { id: "1", name: "a", value: 1 });
      await writeToIdb(idb, "items", { id: "2", name: "b", value: 2 });
      await writeToIdb(idb, "items", { id: "3", name: "c", value: 3 });

      const store = db.store<Item>("items");
      const results = await store.query({ limit: 2 });
      expect(results).toHaveLength(2);
    });

    test("respects offset option", async () => {
      await writeToIdb(idb, "items", { id: "1", name: "a", value: 1 });
      await writeToIdb(idb, "items", { id: "2", name: "b", value: 2 });
      await writeToIdb(idb, "items", { id: "3", name: "c", value: 3 });

      const store = db.store<Item>("items");
      const results = await store.query({ offset: 1 });
      expect(results).toHaveLength(2);
    });

    test("supports pagination with offset and limit", async () => {
      for (let i = 1; i <= 5; i++) {
        await writeToIdb(idb, "items", {
          id: String(i),
          name: `item${i}`,
          value: i,
        });
      }

      const store = db.store<Item>("items");
      const results = await store.query({ offset: 2, limit: 2 });
      expect(results).toHaveLength(2);
      expect(results[0]?.id).toBe("3");
      expect(results[1]?.id).toBe("4");
    });

    test("queries by index and returns ordered results", async () => {
      await writeToIdb(idb, "items", { id: "1", name: "a", value: 3 });
      await writeToIdb(idb, "items", { id: "2", name: "b", value: 1 });
      await writeToIdb(idb, "items", { id: "3", name: "c", value: 2 });

      const store = db.store<Item>("items");
      const results = await store.query({ index: "byValue" });
      expect(results.map((r) => r.value)).toEqual([1, 2, 3]);
    });

    test("supports reverse direction", async () => {
      await writeToIdb(idb, "items", { id: "1", name: "a", value: 1 });
      await writeToIdb(idb, "items", { id: "2", name: "b", value: 2 });
      await writeToIdb(idb, "items", { id: "3", name: "c", value: 3 });

      const store = db.store<Item>("items");
      const results = await store.query({ direction: "prev" });
      expect(results[0]?.id).toBe("3");
      expect(results[2]?.id).toBe("1");
    });
  });
});
