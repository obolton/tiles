import { Database } from "@/utils/idb";
import ThemeModel from "@/models/Theme";
import type { Theme } from "api/types/themes";
import { CacheCollection } from "./collection";

// Type definitions

export interface CachedUser {
  id: string;
  name: string;
  email: string;
  imageUrl: string | null;
}

export interface CachedFolder {
  id: string;
  name: string;
}

export type CachedTheme = Theme;

export interface CachedBookmark {
  id: string;
}

// Cache configuration

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

// Cache collection instances

export const usersCache = new CacheCollection<CachedUser>({
  ttlMs: CACHE_TTL_MS,
  itemsStoreName: "users",
  metaStoreName: "usersMeta",
});

export const foldersCache = new CacheCollection<CachedFolder>({
  ttlMs: CACHE_TTL_MS,
  itemsStoreName: "folders",
  metaStoreName: "foldersMeta",
});

export const themesCache = new CacheCollection<CachedTheme, ThemeModel>({
  ttlMs: CACHE_TTL_MS,
  itemsStoreName: "themes",
  metaStoreName: "themesMeta",
  serialize: (theme) => theme.serialize(),
  deserialize: (raw) => new ThemeModel(raw),
});

export const bookmarksCache = new CacheCollection<CachedBookmark>({
  ttlMs: CACHE_TTL_MS,
  itemsStoreName: "bookmarks",
  metaStoreName: "bookmarksMeta",
});

// Combined schema from all collections

const schema = {
  ...usersCache.schema,
  ...foldersCache.schema,
  ...themesCache.schema,
  ...bookmarksCache.schema,
} as const;

type CacheSchema = typeof schema;

let db: Database<CacheSchema> | null = null;
let currentWorkspaceId: string | null = null;

/**
 * Initializes the cache database for the current user and workspace.
 */
export async function initializeCache(userId: string, workspaceId: string): Promise<void> {
  const name = `tiles-${userId}-${workspaceId}`;

  if (db) {
    if (db.name === name) {
      return; // Already initialized for this user and workspace
    }
    await destroyCache();
  }

  db = new Database({
    name,
    version: 5,
    schema,
  });

  usersCache.initialize(db);
  foldersCache.initialize(db);
  themesCache.initialize(db);
  bookmarksCache.initialize(db);

  currentWorkspaceId = workspaceId;
}

/**
 * Sets the workspace that the cache holds data for. The workspace is known before the user is,
 * so it doesn't depend on the database.
 */
export function setWorkspaceId(workspaceId: string): void {
  currentWorkspaceId = workspaceId;
}

/**
 * Gets the workspace ID for the current cache.
 */
export function getWorkspaceId(): string {
  if (!currentWorkspaceId) {
    throw new Error("Workspace not set. Call setWorkspaceId or initializeCache first.");
  }
  return currentWorkspaceId;
}

/**
 * Destroys the cache database and clears the reference.
 */
export async function destroyCache(): Promise<void> {
  if (db) {
    // Clear in-memory state of all collections
    await Promise.all([
      usersCache.invalidate(),
      foldersCache.invalidate(),
      themesCache.invalidate(),
      bookmarksCache.invalidate(),
    ]);

    await db.deleteDatabase();
    db = null;
  }

  currentWorkspaceId = null;
}
