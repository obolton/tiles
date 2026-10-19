import { ReactiveArray } from "reactivity";
import type { Database, ObjectStore, SchemaDefinition } from "@/utils/idb";

export interface CacheMeta {
  cachedAt: Date;
  nextCursor?: string | null;
}

type CacheCollectionOptions<Raw extends { id: string }, Item extends { id: string } = Raw> = {
  ttlMs: number;
  itemsStoreName: string;
  metaStoreName: string;
} & (
  | { serialize: (item: Item) => Raw; deserialize: (raw: Raw) => Item }
  | { serialize?: never; deserialize?: never }
);

function identity<T>(value: T): T {
  return value;
}

const META_KEY = "meta";

/**
 * A cached collection of items, persisted to IndexedDB.
 */
export class CacheCollection<Raw extends { id: string }, Item extends { id: string } = Raw> {
  readonly items = new ReactiveArray<Item>([]);
  readonly schema: SchemaDefinition;

  private database: Database<SchemaDefinition> | null = null;
  private readonly itemsMap = new Map<string, Item>();
  private readonly ttlMs: number;
  private readonly itemsStoreName: string;
  private readonly metaStoreName: string;
  private readonly serialize: (item: Item) => Raw;
  private readonly deserialize: (raw: Raw) => Item;
  private cachedMeta: CacheMeta | null = null;

  constructor(options: CacheCollectionOptions<Raw, Item>) {
    this.ttlMs = options.ttlMs;
    this.itemsStoreName = options.itemsStoreName;
    this.metaStoreName = options.metaStoreName;
    this.serialize = options.serialize ?? (identity as (item: Item) => Raw);
    this.deserialize = options.deserialize ?? (identity as (raw: Raw) => Item);
    this.schema = {
      [options.itemsStoreName]: { keyPath: "id" },
      [options.metaStoreName]: {},
    };
  }

  /**
   * Initializes the collection with a database instance.
   * Must be called before using any other methods.
   */
  initialize(database: Database<SchemaDefinition>): void {
    this.database = database;
  }

  get isWarm(): boolean {
    return this.cachedMeta !== null;
  }

  private get itemsStore(): ObjectStore<Raw> {
    if (!this.database) {
      throw new Error("Cache not initialized");
    }
    return this.database.store(this.itemsStoreName);
  }

  private get metaStore(): ObjectStore<CacheMeta> {
    if (!this.database) {
      throw new Error("Cache not initialized");
    }
    return this.database.store(this.metaStoreName);
  }

  private isFresh(cachedAt: Date): boolean {
    return Date.now() - cachedAt.getTime() < this.ttlMs;
  }

  private setMemory(items: Item[], meta: CacheMeta): void {
    this.itemsMap.clear();
    for (const item of items) {
      this.itemsMap.set(item.id, item);
    }
    this.items.replace(items);
    this.cachedMeta = meta;
  }

  async getCached(): Promise<{ items: Item[]; meta: CacheMeta } | null> {
    try {
      const meta = await this.metaStore.get(META_KEY);
      if (!meta || !this.isFresh(meta.cachedAt)) {
        return null;
      }

      const rawItems = await this.itemsStore.getAll();
      const items = rawItems.map(this.deserialize);
      this.setMemory(items, meta);
      return { items, meta };
    } catch {
      return null;
    }
  }

  /**
   * Sets the cached items, replacing any existing data.
   */
  async set(items: Item[], meta?: Omit<CacheMeta, "cachedAt">): Promise<void> {
    const fullMeta: CacheMeta = { ...meta, cachedAt: new Date() };
    this.setMemory(items, fullMeta);

    try {
      await this.itemsStore.clear();
      await this.itemsStore.putMany(items.map(this.serialize));
      await this.metaStore.put(fullMeta, META_KEY);
    } catch (error) {
      if (import.meta.env.DEV) {
        console.warn("Failed to cache:", error);
      }
    }
  }

  /**
   * Appends items to the cache.
   */
  async append(items: Item[], nextCursor?: string | null): Promise<void> {
    const fullMeta: CacheMeta = {
      ...this.cachedMeta,
      nextCursor: nextCursor !== undefined ? nextCursor : this.cachedMeta?.nextCursor,
      cachedAt: new Date(),
    };

    for (const item of items) {
      this.itemsMap.set(item.id, item);
    }
    this.items.push(...items);
    this.cachedMeta = fullMeta;

    try {
      await this.itemsStore.putMany(items.map(this.serialize));
      await this.metaStore.put(fullMeta, META_KEY);
    } catch (error) {
      if (import.meta.env.DEV) {
        console.warn("Failed to append to cache:", error);
      }
    }
  }

  /**
   * Invalidates the cache.
   */
  async invalidate(): Promise<void> {
    this.itemsMap.clear();
    this.items.clear();
    this.cachedMeta = null;

    try {
      await this.itemsStore.clear();
      await this.metaStore.delete(META_KEY);
    } catch (error) {
      if (import.meta.env.DEV) {
        console.warn("Failed to invalidate cache:", error);
      }
    }
  }

  /**
   * Gets an item by ID.
   */
  getById(id: string): Item | null {
    return this.itemsMap.get(id) ?? null;
  }

  /**
   * Deletes items by ID.
   */
  async delete(ids: string[]): Promise<void> {
    for (const id of ids) {
      this.itemsMap.delete(id);
    }

    const idSet = new Set(ids);
    this.items.filter((item) => !idSet.has(item.id));

    try {
      await this.itemsStore.deleteMany(ids);
    } catch (error) {
      if (import.meta.env.DEV) {
        console.warn("Failed to delete from cache:", error);
      }
    }
  }

  /**
   * Inserts or updates a single item.
   */
  async upsert(item: Item): Promise<void> {
    const existingIndex = this.items.value.findIndex((i) => i.id === item.id);
    this.itemsMap.set(item.id, item);

    if (existingIndex >= 0) {
      this.items.splice(existingIndex, 1, item);
    } else {
      this.items.push(item);
    }

    try {
      await this.itemsStore.put(this.serialize(item));
    } catch (error) {
      if (import.meta.env.DEV) {
        console.warn("Failed to upsert cache:", error);
      }
    }
  }
}
