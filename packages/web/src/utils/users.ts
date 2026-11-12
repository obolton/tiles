import client from "@/api/client";
import { usersCache, getWorkspaceId } from "./cache";

export async function getWorkspaceUsers() {
  const cached = await usersCache.getCached();
  if (cached) {
    return { users: cached.items, nextCursor: cached.meta.nextCursor ?? null };
  }

  const workspaceId = getWorkspaceId();
  const result = await client.workspaces.listUsers.query({ workspaceId });
  await usersCache.set(result.users, { nextCursor: result.nextCursor });

  return result;
}

export function getUserName(userId: string): string | null {
  return usersCache.getById(userId)?.name ?? null;
}
