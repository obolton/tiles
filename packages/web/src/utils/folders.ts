import client from "@/api/client";
import { get, set, remove } from "./state";

export interface Folder {
  id: string;
  name: string;
}

interface FolderCache {
  folders: Folder[];
  hasMore: boolean;
}

function getCacheKey(workspaceId: string) {
  return `folders:${workspaceId}`;
}

export function getCachedWorkspaceFolders(workspaceId: string) {
  return get<FolderCache>(getCacheKey(workspaceId));
}

export async function getWorkspaceFolders(workspaceId: string) {
  const cached = getCachedWorkspaceFolders(workspaceId);
  if (cached) {
    return cached;
  }

  const result = await client.folders.list.query({ workspaceId, offset: 0 });
  set(getCacheKey(workspaceId), result);
  return result;
}

export function invalidateWorkspaceFolders(workspaceId: string) {
  remove(getCacheKey(workspaceId));
}
