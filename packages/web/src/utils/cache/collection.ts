import { ReactiveArray } from "@/utils/reactivity";
import type { Database, ObjectStore, SchemaDefinition } from "@/utils/idb";

export interface CacheMeta {
  cachedAt: Date;
  nextCursor?: string | null;
}

interface CacheCollectionOptions {
  ttlMs: number;
  itemsStoreName: string;
  metaStoreName: string;
}

const META_KEY = "meta";

/**
 * A cached collection of items, persisted to IndexedDB.
 */
export class CacheCollection<T extends { id: string }> {
  readonly items = new ReactiveArray<T>([]);
  readonly schema: SchemaDefinition;

  private database: Database<SchemaDefinition> | null = null;
  private readonly itemsMap = new Map<string, T>();
  private readonly ttlMs: number;
  private readonly itemsStoreName: string;
  private readonly metaStoreName: string;
  private cachedMeta: CacheMeta | null = null;

  constructor(options: CacheCollectionOptions) {
    this.ttlMs = options.ttlMs;
    this.itemsStoreName = options.itemsStoreName;
    this.metaStoreName = options.metaStoreName;
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

  get meta(): CacheMeta | null {
    return this.cachedMeta;
  }

  get isWarm(): boolean {
    return this.cachedMeta !== null;
  }

  /**
   * Returns the number of items in the cache.
   */
  get count(): number {
    return this.items.length;
  }

  private get itemsStore(): ObjectStore<T> {
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

  private setMemory(items: T[], meta: CacheMeta): void {
    this.itemsMap.clear();
    for (const item of items) {
      this.itemsMap.set(item.id, item);
    }
    this.items.replace(items);
    this.cachedMeta = meta;
  }

  async getCached(): Promise<{ items: T[]; meta: CacheMeta } | null> {
    try {
      const meta = await this.metaStore.get(META_KEY);
      if (!meta || !this.isFresh(meta.cachedAt)) {
        return null;
      }

      const items = await this.itemsStore.getAll();
      this.setMemory(items, meta);
      return { items, meta };
    } catch {
      return null;
    }
  }

  /**
   * Sets the cached items, replacing any existing data.
   */
  async set(items: T[], meta?: Omit<CacheMeta, "cachedAt">): Promise<void> {
    const fullMeta: CacheMeta = { ...meta, cachedAt: new Date() };
    this.setMemory(items, fullMeta);

    try {
      await this.itemsStore.clear();
      await this.itemsStore.putMany(items);
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
  async append(items: T[], nextCursor?: string | null): Promise<void> {
    const fullMeta: CacheMeta = {
      ...this.cachedMeta,
      nextCursor:
        nextCursor !== undefined ? nextCursor : this.cachedMeta?.nextCursor,
      cachedAt: new Date(),
    };

    for (const item of items) {
      this.itemsMap.set(item.id, item);
    }
    this.items.push(...items);
    this.cachedMeta = fullMeta;

    try {
      await this.itemsStore.putMany(items);
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
  getById(id: string): T | null {
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
   * Updates a single item's properties by ID.
   * Returns the updated item, or null if the item doesn't exist.
   */
  async update(id: string, updates: Partial<Omit<T, "id">>): Promise<T | null> {
    const existing = this.itemsMap.get(id);
    if (!existing) {
      return null;
    }

    const updated = { ...existing, ...updates };
    this.itemsMap.set(id, updated);

    const index = this.items.value.findIndex((item) => item.id === id);
    if (index >= 0) {
      this.items.splice(index, 1, updated);
    }

    try {
      await this.itemsStore.put(updated);
    } catch (error) {
      if (import.meta.env.DEV) {
        console.warn("Failed to update cache:", error);
      }
    }

    return updated;
  }

  /**
   * Inserts or updates a single item.
   */
  async upsert(item: T): Promise<void> {
    const existingIndex = this.items.value.findIndex((i) => i.id === item.id);
    this.itemsMap.set(item.id, item);

    if (existingIndex >= 0) {
      this.items.splice(existingIndex, 1, item);
    } else {
      this.items.push(item);
    }

    try {
      await this.itemsStore.put(item);
    } catch (error) {
      if (import.meta.env.DEV) {
        console.warn("Failed to upsert cache:", error);
      }
    }
  }
}
