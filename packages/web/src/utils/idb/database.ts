import type { SchemaDefinition, DatabaseOptions } from "./types";
import { ObjectStore } from "./object-store";

/**
 * Manages an IndexedDB database connection with typed store access.
 *
 * @example
 * ```ts
 * const schema = {
 *   operations: {
 *     keyPath: "id",
 *     indexes: { byPage: { keyPath: "pageId" } },
 *   },
 * } as const;
 *
 * const db = new Database({ name: "my-app", version: 1, schema });
 * const operations = db.store<Operation>("operations");
 * ```
 */
export class Database<Schema extends SchemaDefinition> {
  readonly name: string;
  private readonly version: number;
  private readonly schema: Schema;
  private readonly onUpgrade?: DatabaseOptions<Schema>["onUpgrade"];
  private readonly stores = new Map<string, ObjectStore<unknown>>();

  private connection: IDBDatabase | null = null;
  private connectionPromise: Promise<IDBDatabase> | null = null;

  constructor(options: DatabaseOptions<Schema>) {
    this.name = options.name;
    this.version = options.version;
    this.schema = options.schema;
    this.onUpgrade = options.onUpgrade;
  }

  /**
   * Whether the database connection is open.
   */
  get isOpen(): boolean {
    return this.connection !== null;
  }

  /**
   * Opens the database connection.
   */
  async open(): Promise<IDBDatabase> {
    if (import.meta.env.SSR || typeof indexedDB === "undefined") {
      throw new Error("IndexedDB not available");
    }

    if (this.connection) {
      return this.connection;
    }

    this.connectionPromise ??= this.createConnection();

    try {
      this.connection = await this.connectionPromise;
      return this.connection;
    } catch (error) {
      this.connectionPromise = null;
      throw error;
    }
  }

  private createConnection(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.name, this.version);

      request.addEventListener("error", () => reject(request.error));
      request.addEventListener("success", () => resolve(request.result));
      request.addEventListener("upgradeneeded", (event) => {
        this.handleUpgrade(request, event.oldVersion);
      });
    });
  }

  private handleUpgrade(request: IDBOpenDBRequest, oldVersion: number) {
    const db = request.result;
    const transaction = request.transaction;

    if (!transaction) {
      throw new Error("No transaction available during database upgrade");
    }

    // Auto-create stores and indexes based on schema
    for (const [storeName, storeConfig] of Object.entries(this.schema)) {
      let store: IDBObjectStore;

      if (!db.objectStoreNames.contains(storeName)) {
        store = db.createObjectStore(storeName, {
          keyPath: storeConfig.keyPath,
          autoIncrement: storeConfig.autoIncrement,
        });
      } else {
        store = transaction.objectStore(storeName);
      }

      // Create indexes that don't exist
      if (storeConfig.indexes) {
        for (const [indexName, indexConfig] of Object.entries(
          storeConfig.indexes,
        )) {
          if (!store.indexNames.contains(indexName)) {
            store.createIndex(indexName, indexConfig.keyPath, {
              unique: indexConfig.unique,
              multiEntry: indexConfig.multiEntry,
            });
          }
        }
      }
    }

    // Call custom upgrade handler for additional migrations
    this.onUpgrade?.(db, oldVersion, this.version, transaction);
  }

  /**
   * Gets a typed ObjectStore instance for performing operations on a store.
   * Instances are cached for reuse.
   *
   * @param storeName - Name of the store (must exist in schema)
   * @returns ObjectStore instance for the specified store
   *
   * @example
   * ```ts
   * interface Operation { id: string; type: string; }
   * const operations = db.store<Operation>("operations");
   * await operations.put({ id: "1", type: "insert" });
   * ```
   */
  store<T>(storeName: keyof Schema & string): ObjectStore<T> {
    let store = this.stores.get(storeName);

    if (!store) {
      store = new ObjectStore<T>(this, storeName);
      this.stores.set(storeName, store);
    }

    return store as ObjectStore<T>;
  }

  /**
   * Closes the database connection.
   */
  close() {
    this.connection?.close();
    this.connection = null;
    this.connectionPromise = null;
  }

  /**
   * Deletes the database.
   */
  async deleteDatabase(): Promise<void> {
    this.close();

    return new Promise((resolve, reject) => {
      const request = indexedDB.deleteDatabase(this.name);
      request.addEventListener("success", () => resolve());
      request.addEventListener("error", () => reject(request.error));
    });
  }
}
