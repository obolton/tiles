import { describe, expect, test, beforeEach, afterEach } from "vitest";
import "fake-indexeddb/auto";
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

  describe("isOpen", () => {
    test("returns false before opening", () => {
      expect(db.isOpen).toBe(false);
    });

    test("returns true after opening", async () => {
      await db.open();
      expect(db.isOpen).toBe(true);
    });

    test("returns false after closing", async () => {
      await db.open();
      db.close();
      expect(db.isOpen).toBe(false);
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
      await db.open();
      db.close();
      expect(db.isOpen).toBe(false);
    });

    test("can be called before opening", () => {
      expect(() => db.close()).not.toThrow();
    });
  });

  describe("deleteDatabase", () => {
    test("deletes the database", async () => {
      await db.open();
      await db.deleteDatabase();
      expect(db.isOpen).toBe(false);
    });
  });

  describe("onUpgrade", () => {
    test("calls the onUpgrade callback during upgrade", async () => {
      let upgradeVersion: number | undefined;

      const dbWithUpgrade = new Database({
        name: "upgrade-test-db",
        version: 1,
        schema,
        onUpgrade: (_db, oldVersion) => {
          upgradeVersion = oldVersion;
        },
      });

      await dbWithUpgrade.open();
      expect(upgradeVersion).toBe(0);
      await dbWithUpgrade.deleteDatabase();
    });
  });
});
