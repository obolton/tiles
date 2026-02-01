import client from "@/api/client";
import { themesCache, getWorkspaceId } from "./cache";

export type { CachedTheme as WorkspaceTheme } from "./cache";

export async function getWorkspaceThemes() {
  const cached = await themesCache.getCached();
  if (cached) {
    return cached.items;
  }

  const workspaceId = getWorkspaceId();
  const result = await client.themes.list.query({ workspaceId });
  await themesCache.set(result);

  return result;
}

export async function invalidateWorkspaceThemes(): Promise<void> {
  await themesCache.invalidate();
}
