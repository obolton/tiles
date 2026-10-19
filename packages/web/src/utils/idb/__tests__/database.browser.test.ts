import { describe, expect, test, beforeEach, afterEach } from "vitest";
import { Database } from "../database";
import { ObjectStore } from "../object-store";

const schema = {
  items: {
    keyPath: "id",
    indexes: {
      byName: { keyPath: "name" },
    },
  },
} as const;

describe("Database (browser)", () => {
  let db: Database<typeof schema>;

  beforeEach(() => {
    db = new Database({
      name: "test-db",
      version: 1,
      schema,
    });
  });

  afterEach(async () => {
    await db.deleteDatabase();
  });

  describe("open", () => {
    test("opens the database", async () => {
      const connection = await db.open();
      expect(connection).toBeInstanceOf(IDBDatabase);
    });

    test("returns the same connection on subsequent calls", async () => {
      const connection1 = await db.open();
      const connection2 = await db.open();
      expect(connection1).toBe(connection2);
    });

    test("creates object stores from schema", async () => {
      const connection = await db.open();
      expect(connection.objectStoreNames.contains("items")).toBe(true);
    });

    test("creates indexes from schema", async () => {
      const connection = await db.open();
      const transaction = connection.transaction("items", "readonly");
      const store = transaction.objectStore("items");
      expect(store.indexNames.contains("byName")).toBe(true);
    });
  });

  describe("store", () => {
    test("returns an ObjectStore instance", () => {
      const store = db.store("items");
      expect(store).toBeInstanceOf(ObjectStore);
    });
  });

  describe("close", () => {
    test("closes the database connection", async () => {
      const connection = await db.open();
      db.close();
      expect(await db.open()).not.toBe(connection);
    });
  });

  describe("deleteDatabase", () => {
    test("deletes the database", async () => {
      const store = db.store<{ id: string }>("items");
      await store.put({ id: "1" });
      await db.deleteDatabase();

      expect(await store.getAll()).toEqual([]);
    });
  });
});
