import client from "@/api/client";
import { get, set, remove } from "./state";

export interface WorkspaceUser {
  id: string;
  name: string;
  email: string;
  imageUrl: string | null;
}

interface UsersCache {
  users: WorkspaceUser[];
  hasMore: boolean;
}

function getCacheKey(workspaceId: string) {
  return `users:${workspaceId}`;
}

export function getCachedWorkspaceUsers(workspaceId: string) {
  return get<UsersCache>(getCacheKey(workspaceId));
}

export async function getWorkspaceUsers(workspaceId: string) {
  const cached = getCachedWorkspaceUsers(workspaceId);
  if (cached) {
    return cached;
  }

  const result = await client.workspaces.listUsers.query({
    workspaceId,
    offset: 0,
  });
  set(getCacheKey(workspaceId), result);
  return result;
}

export function invalidateWorkspaceUsers(workspaceId: string) {
  remove(getCacheKey(workspaceId));
}

export function getUserName(
  workspaceId: string,
  userId: string,
): string | null {
  const cached = getCachedWorkspaceUsers(workspaceId);
  if (!cached) {
    return null;
  }
  const user = cached.users.find((u) => u.id === userId);
  return user?.name ?? null;
}
