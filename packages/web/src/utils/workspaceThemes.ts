import client from "@/api/client";
import { getThemesStore, getThemesMetaStore, getWorkspaceId } from "./cache";

const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes
const THEMES_META_KEY = "meta";

export type { CachedTheme as WorkspaceTheme } from "./cache";

function isFresh(cachedAt: Date): boolean {
  return Date.now() - cachedAt.getTime() < CACHE_TTL_MS;
}

export async function getCachedWorkspaceThemes() {
  try {
    const metaStore = getThemesMetaStore();
    const meta = await metaStore.get(THEMES_META_KEY);

    if (!meta || !isFresh(meta.cachedAt)) {
      return null;
    }

    const themesStore = getThemesStore();
    return themesStore.getAll();
  } catch {
    return null;
  }
}

export async function getWorkspaceThemes() {
  const cached = await getCachedWorkspaceThemes();
  if (cached) {
    return cached;
  }

  const workspaceId = getWorkspaceId();
  const result = await client.themes.list.query({ workspaceId });

  try {
    const themesStore = getThemesStore();
    const metaStore = getThemesMetaStore();

    // Clear old themes and insert new ones
    await themesStore.clear();
    await themesStore.putMany(result);

    // Update metadata
    await metaStore.put({ cachedAt: new Date() }, THEMES_META_KEY);
  } catch (error) {
    if (import.meta.env.DEV) {
      console.warn("Failed to cache themes:", error);
    }
  }

  return result;
}

export async function invalidateWorkspaceThemes() {
  try {
    const themesStore = getThemesStore();
    const metaStore = getThemesMetaStore();

    await themesStore.clear();
    await metaStore.delete(THEMES_META_KEY);
  } catch (error) {
    if (import.meta.env.DEV) {
      console.warn("Failed to invalidate themes cache:", error);
    }
  }
}
