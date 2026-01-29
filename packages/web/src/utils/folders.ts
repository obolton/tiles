import client from "@/api/client";
import { getFoldersStore, getFoldersMetaStore, getWorkspaceId } from "./cache";

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
const FOLDERS_META_KEY = "meta";

export type { CachedFolder as Folder } from "./cache";

function isFresh(cachedAt: Date): boolean {
  return Date.now() - cachedAt.getTime() < CACHE_TTL_MS;
}

export async function getCachedWorkspaceFolders() {
  try {
    const metaStore = getFoldersMetaStore();
    const meta = await metaStore.get(FOLDERS_META_KEY);

    if (!meta || !isFresh(meta.cachedAt)) {
      return null;
    }

    const foldersStore = getFoldersStore();
    const folders = await foldersStore.getAll();

    return { folders, nextCursor: meta.nextCursor };
  } catch {
    return null;
  }
}

export async function getWorkspaceFolders() {
  const cached = await getCachedWorkspaceFolders();
  if (cached) {
    return cached;
  }

  const workspaceId = getWorkspaceId();
  const result = await client.folders.list.query({ workspaceId });

  try {
    const foldersStore = getFoldersStore();
    const metaStore = getFoldersMetaStore();

    // Clear old folders and insert new ones
    await foldersStore.clear();
    await foldersStore.putMany(result.folders);

    // Update metadata
    await metaStore.put(
      { nextCursor: result.nextCursor, cachedAt: new Date() },
      FOLDERS_META_KEY,
    );
  } catch (error) {
    if (import.meta.env.DEV) {
      console.warn("Failed to cache folders:", error);
    }
  }

  return result;
}

export async function invalidateWorkspaceFolders() {
  try {
    const foldersStore = getFoldersStore();
    const metaStore = getFoldersMetaStore();

    await foldersStore.clear();
    await metaStore.delete(FOLDERS_META_KEY);
  } catch (error) {
    if (import.meta.env.DEV) {
      console.warn("Failed to invalidate folders cache:", error);
    }
  }
}
