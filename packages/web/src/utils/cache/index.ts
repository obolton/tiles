import { Database } from "@/utils/idb";
import { foldersSchema, type CachedFolder, type FoldersMeta } from "./folders";
import { bookmarksSchema } from "./bookmarks";
import { themesSchema, type CachedTheme, type ThemesMeta } from "./themes";
import { usersSchema, type CachedUser, type UsersMeta } from "./users";

export type { CachedFolder, FoldersMeta } from "./folders";
export type { CachedTheme, ThemesMeta } from "./themes";
export type { CachedUser, UsersMeta } from "./users";

const schema = {
  ...foldersSchema,
  ...bookmarksSchema,
  ...themesSchema,
  ...usersSchema,
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
    version: 2,
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
 * Gets the themes store for caching workspace themes.
 */
export function getThemesStore() {
  return getDatabase().store<CachedTheme>("themes");
}

/**
 * Gets the themes metadata store for caching freshness info.
 */
export function getThemesMetaStore() {
  return getDatabase().store<ThemesMeta>("themesMeta");
}

/**
 * Gets the users store for caching workspace users.
 */
export function getUsersStore() {
  return getDatabase().store<CachedUser>("users");
}

/**
 * Gets the users metadata store for caching pagination and freshness info.
 */
export function getUsersMetaStore() {
  return getDatabase().store<UsersMeta>("usersMeta");
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
