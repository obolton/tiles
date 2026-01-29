import { Database } from "@/utils/idb";
import { foldersSchema, type CachedFolder, type FoldersMeta } from "./folders";
import { bookmarksSchema } from "./bookmarks";

export type { CachedFolder, FoldersMeta } from "./folders";

const schema = {
  ...foldersSchema,
  ...bookmarksSchema,
} as const;

type CacheSchema = typeof schema;

let db: Database<CacheSchema> | null = null;
let currentWorkspaceId: string | null = null;

/**
 * Initializes the cache database for the current user and workspace.
 */
export function initializeCache(userId: string, workspaceId: string): void {
  if (db) {
    throw new Error("Cache already initialized");
  }

  db = new Database({
    name: `tiles-${userId}-${workspaceId}`,
    version: 1,
    schema,
  });
  currentWorkspaceId = workspaceId;
}

function getDatabase(): Database<CacheSchema> {
  if (!db) {
    throw new Error("Cache not initialized. Call initializeCache first.");
  }
  return db;
}

/**
 * Checks if the cache has been initialized.
 */
export function isCacheInitialized(): boolean {
  return db !== null;
}

/**
 * Gets the workspace ID for the current cache.
 */
export function getWorkspaceId(): string {
  if (!currentWorkspaceId) {
    throw new Error("Cache not initialized. Call initializeCache first.");
  }
  return currentWorkspaceId;
}

/**
 * Gets the folders store for caching individual folders.
 */
export function getFoldersStore() {
  return getDatabase().store<CachedFolder>("folders");
}

/**
 * Gets the folders metadata store for caching pagination and freshness info.
 */
export function getFoldersMetaStore() {
  return getDatabase().store<FoldersMeta>("foldersMeta");
}

/**
 * Gets the bookmarks store for caching page bookmarks.
 */
export function getBookmarksStore() {
  return getDatabase().store<boolean>("bookmarks");
}

/**
 * Destroys the cache database and clears the reference.
 */
export async function destroyCache(): Promise<void> {
  if (db) {
    await db.deleteDatabase();
    db = null;
    currentWorkspaceId = null;
  }
}
