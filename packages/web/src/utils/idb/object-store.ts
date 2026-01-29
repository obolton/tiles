import type { Database } from "./database";
import type { SchemaDefinition, QueryOptions } from "./types";
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

  // Helpers

  private async openStore(mode: IDBTransactionMode): Promise<IDBObjectStore> {
    const db = await this.database.open();
    return db.transaction(this.storeName, mode).objectStore(this.storeName);
  }

  // Core operations

  /**
   * Gets a record by its primary key.
   * Returns undefined if the record doesn't exist.
   */
  async get(key: IDBValidKey): Promise<T | undefined> {
    const store = await this.openStore("readonly");
    return toPromise<T>(store.get(key));
  }

  /**
   * Checks if a record exists by its primary key.
   */
  async has(key: IDBValidKey): Promise<boolean> {
    const store = await this.openStore("readonly");
    const count = await toPromise(store.count(key));
    return count > 0;
  }

  /**
   * Gets all records, optionally filtered by key range.
   *
   * @param query - Key or key range to filter by
   * @param count - Maximum number of records to return
   */
  async getAll(
    query?: IDBValidKey | IDBKeyRange,
    count?: number,
  ): Promise<T[]> {
    const store = await this.openStore("readonly");
    return toPromise<T[]>(store.getAll(query, count));
  }

  /**
   * Gets all keys, optionally filtered by key range.
   *
   * @param query - Key or key range to filter by
   * @param count - Maximum number of keys to return
   */
  async getKeys(
    query?: IDBValidKey | IDBKeyRange,
    count?: number,
  ): Promise<IDBValidKey[]> {
    const store = await this.openStore("readonly");
    return toPromise<IDBValidKey[]>(store.getAllKeys(query, count));
  }

  /**
   * Inserts or updates a record.
   * Returns the key of the inserted/updated record.
   *
   * @param value - The record to store
   * @param key - Key for out-of-line key stores (ignored for inline key stores)
   */
  async put(value: T, key?: IDBValidKey): Promise<IDBValidKey> {
    const store = await this.openStore("readwrite");
    return toPromise<IDBValidKey>(store.put(value, key));
  }

  /**
   * Inserts a new record. Fails if the key already exists.
   * Returns the key of the inserted record.
   *
   * @param value - The record to store
   * @param key - Key for out-of-line key stores (ignored for inline key stores)
   */
  async add(value: T, key?: IDBValidKey): Promise<IDBValidKey> {
    const store = await this.openStore("readwrite");
    return toPromise<IDBValidKey>(store.add(value, key));
  }

  /**
   * Deletes a record by its primary key.
   */
  async delete(key: IDBValidKey): Promise<void> {
    const store = await this.openStore("readwrite");
    await toPromise(store.delete(key));
  }

  /**
   * Deletes all records from the store.
   */
  async clear(): Promise<void> {
    const store = await this.openStore("readwrite");
    await toPromise(store.clear());
  }

  /**
   * Counts records, optionally filtered by key range.
   */
  async count(query?: IDBValidKey | IDBKeyRange): Promise<number> {
    const store = await this.openStore("readonly");
    return toPromise<number>(store.count(query));
  }

  // Index operations

  /**
   * Gets the first record matching an index value.
   */
  async getByIndex(
    indexName: string,
    query: IDBValidKey | IDBKeyRange,
  ): Promise<T | undefined> {
    const store = await this.openStore("readonly");
    return toPromise<T>(store.index(indexName).get(query));
  }

  /**
   * Gets all records matching an index value.
   *
   * @param indexName - Name of the index to query
   * @param query - Key or key range to filter by
   * @param count - Maximum number of records to return
   */
  async getAllByIndex(
    indexName: string,
    query?: IDBValidKey | IDBKeyRange,
    count?: number,
  ): Promise<T[]> {
    const store = await this.openStore("readonly");
    return toPromise<T[]>(store.index(indexName).getAll(query, count));
  }

  /**
   * Counts records matching an index value.
   */
  async countByIndex(
    indexName: string,
    query?: IDBValidKey | IDBKeyRange,
  ): Promise<number> {
    const store = await this.openStore("readonly");
    return toPromise<number>(store.index(indexName).count(query));
  }

  // Bulk operations

  /**
   * Inserts or updates multiple records in a single transaction.
   * Returns the keys of all inserted/updated records.
   *
   * @param values - Array of records to store
   * @param keys - Keys for out-of-line key stores (ignored for inline key stores)
   */
  async putMany(values: T[], keys?: IDBValidKey[]): Promise<IDBValidKey[]> {
    const store = await this.openStore("readwrite");
    return Promise.all(
      values.map((value, i) =>
        toPromise<IDBValidKey>(store.put(value, keys?.[i])),
      ),
    );
  }

  /**
   * Deletes multiple records by their primary keys in a single transaction.
   */
  async deleteMany(keys: IDBValidKey[]): Promise<void> {
    const store = await this.openStore("readwrite");
    await Promise.all(keys.map((key) => toPromise(store.delete(key))));
  }

  // Cursor-based queries

  /**
   * Queries records using a cursor.
   *
   * @example
   * ```ts
   * // Get first 10 records sorted by timestamp (descending)
   * const recent = await store.query({
   *   index: "byTimestamp",
   *   direction: "prev",
   *   limit: 10,
   * });
   *
   * // Paginate: skip first 20, get next 10
   * const page3 = await store.query({ offset: 20, limit: 10 });
   * ```
   */
  async query(options: QueryOptions = {}): Promise<T[]> {
    const store = await this.openStore("readonly");

    return new Promise((resolve, reject) => {
      const source = options.index ? store.index(options.index) : store;
      const request = source.openCursor(options.query, options.direction);

      const results: T[] = [];
      let skipped = 0;

      request.addEventListener("success", () => {
        const cursor = request.result;

        if (!cursor) {
          resolve(results);
          return;
        }

        // Handle offset
        if (options.offset && skipped < options.offset) {
          skipped++;
          cursor.continue();
          return;
        }

        // Handle limit
        if (options.limit && results.length >= options.limit) {
          resolve(results);
          return;
        }

        results.push(cursor.value as T);
        cursor.continue();
      });

      request.addEventListener("error", () => reject(request.error));
    });
  }
}
