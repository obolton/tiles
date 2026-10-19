import type { Database } from "./database";
import type { SchemaDefinition } from "./types";
import { toPromise } from "./utils";

/**
 * Provides typed operations for an IndexedDB object store.
 *
 * @example
 * ```ts
 * interface User { id: string; name: string; email: string; }
 * const users = db.store<User>("users");
 *
 * await users.put({ id: "1", name: "Alice", email: "alice@example.com" });
 * const user = await users.get("1");
 * ```
 */
export class ObjectStore<T> {
  private readonly database: Database<SchemaDefinition>;
  private readonly storeName: string;

  constructor(database: Database<SchemaDefinition>, storeName: string) {
    this.database = database;
    this.storeName = storeName;
  }

  private async openStore(mode: IDBTransactionMode): Promise<IDBObjectStore> {
    const db = await this.database.open();
    return db.transaction(this.storeName, mode).objectStore(this.storeName);
  }

  /**
   * Gets a record by its primary key.
   * Returns undefined if the record doesn't exist.
   */
  async get(key: IDBValidKey): Promise<T | undefined> {
    const store = await this.openStore("readonly");
    return toPromise<T>(store.get(key));
  }

  /**
   * Gets all records in the store.
   */
  async getAll(): Promise<T[]> {
    const store = await this.openStore("readonly");
    return toPromise<T[]>(store.getAll());
  }

  /**
   * Inserts or updates a record.
   * The key is required for stores without a key path.
   */
  async put(value: T, key?: IDBValidKey): Promise<IDBValidKey> {
    const store = await this.openStore("readwrite");
    return toPromise<IDBValidKey>(store.put(value, key));
  }

  /**
   * Inserts or updates multiple records in a single transaction.
   */
  async putMany(values: T[]): Promise<IDBValidKey[]> {
    const store = await this.openStore("readwrite");
    return Promise.all(values.map((value) => toPromise<IDBValidKey>(store.put(value))));
  }

  /**
   * Deletes a record by its primary key.
   */
  async delete(key: IDBValidKey): Promise<void> {
    const store = await this.openStore("readwrite");
    await toPromise(store.delete(key));
  }

  /**
   * Deletes multiple records in a single transaction.
   */
  async deleteMany(keys: IDBValidKey[]): Promise<void> {
    const store = await this.openStore("readwrite");
    await Promise.all(keys.map((key) => toPromise(store.delete(key))));
  }

  /**
   * Deletes all records in the store.
   */
  async clear(): Promise<void> {
    const store = await this.openStore("readwrite");
    await toPromise(store.clear());
  }
}
