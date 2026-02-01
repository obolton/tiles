import client from "@/api/client";
import { foldersCache, getWorkspaceId } from "./cache";

export type { CachedFolder as Folder } from "./cache";

export async function getWorkspaceFolders() {
  const cached = await foldersCache.getCached();
  if (cached) {
    return {
      folders: cached.items,
      nextCursor: cached.meta.nextCursor ?? null,
    };
  }

  const workspaceId = getWorkspaceId();
  const result = await client.folders.list.query({ workspaceId });
  await foldersCache.set(result.folders, { nextCursor: result.nextCursor });

  return result;
}

export async function invalidateWorkspaceFolders(): Promise<void> {
  await foldersCache.invalidate();
}
