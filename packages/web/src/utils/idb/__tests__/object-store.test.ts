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
});
