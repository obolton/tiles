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

describe("Database", () => {
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

  describe("constructor", () => {
    test("sets the database name", () => {
      expect(db.name).toBe("test-db");
    });
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

    test("returns the same instance for the same store name", () => {
      const store1 = db.store("items");
      const store2 = db.store("items");
      expect(store1).toBe(store2);
    });
  });

  describe("close", () => {
    test("closes the database connection", async () => {
      const connection = await db.open();
      db.close();
      expect(await db.open()).not.toBe(connection);
    });

    test("can be called before opening", () => {
      expect(() => db.close()).not.toThrow();
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

  describe("upgrade", () => {
    test("adds stores and indexes missing from an existing database", async () => {
      await db.open();
      db.close();

      const upgraded = new Database({
        name: "test-db",
        version: 2,
        schema: {
          items: {
            keyPath: "id",
            indexes: { byName: { keyPath: "name" }, byAge: { keyPath: "age" } },
          },
          extra: { keyPath: "id" },
        },
      });
      const upgradedConnection = await upgraded.open();

      expect(upgradedConnection.version).toBe(2);
      expect(upgradedConnection.objectStoreNames.contains("extra")).toBe(true);
      const store = upgradedConnection.transaction("items", "readonly").objectStore("items");
      expect(store.indexNames.contains("byName")).toBe(true);
      expect(store.indexNames.contains("byAge")).toBe(true);
      upgraded.close();
    });

    test("drops stores that are no longer in the schema", async () => {
      await db.open();
      db.close();

      const upgraded = new Database({
        name: "test-db",
        version: 2,
        schema: { other: { keyPath: "id" } },
      });
      const connection = await upgraded.open();

      expect(Array.from(connection.objectStoreNames)).toEqual(["other"]);
      upgraded.close();
    });
  });
});
