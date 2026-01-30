import client from "@/api/client";
import {
  getUsersStore,
  getUsersMetaStore,
  getWorkspaceId,
  type CachedUser,
} from "./cache";

export type WorkspaceUser = CachedUser;

export interface UsersResult {
  users: WorkspaceUser[];
  nextCursor: string | null;
}

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
const USERS_META_KEY = "meta";

const usersMap = new Map<string, WorkspaceUser>();

function isFresh(cachedAt: Date): boolean {
  return Date.now() - cachedAt.getTime() < CACHE_TTL_MS;
}

function populateUsersMap(users: WorkspaceUser[]): void {
  usersMap.clear();
  for (const user of users) {
    usersMap.set(user.id, user);
  }
}

export async function getCachedWorkspaceUsers(): Promise<UsersResult | null> {
  try {
    const metaStore = getUsersMetaStore();
    const meta = await metaStore.get(USERS_META_KEY);

    if (!meta || !isFresh(meta.cachedAt)) {
      return null;
    }

    const usersStore = getUsersStore();
    const users = await usersStore.getAll();

    populateUsersMap(users);

    return { users, nextCursor: meta.nextCursor };
  } catch {
    return null;
  }
}

export async function getWorkspaceUsers(): Promise<UsersResult> {
  const cached = await getCachedWorkspaceUsers();
  if (cached) {
    return cached;
  }

  const workspaceId = getWorkspaceId();
  const result = await client.workspaces.listUsers.query({ workspaceId });

  populateUsersMap(result.users);

  try {
    const usersStore = getUsersStore();
    const metaStore = getUsersMetaStore();

    // Clear old users and insert new ones
    await usersStore.clear();
    await usersStore.putMany(result.users);

    // Update metadata
    await metaStore.put(
      { nextCursor: result.nextCursor, cachedAt: new Date() },
      USERS_META_KEY,
    );
  } catch (error) {
    if (import.meta.env.DEV) {
      console.warn("Failed to cache users:", error);
    }
  }

  return result;
}

export async function invalidateWorkspaceUsers(): Promise<void> {
  usersMap.clear();

  try {
    const usersStore = getUsersStore();
    const metaStore = getUsersMetaStore();

    await usersStore.clear();
    await metaStore.delete(USERS_META_KEY);
  } catch (error) {
    if (import.meta.env.DEV) {
      console.warn("Failed to invalidate users cache:", error);
    }
  }
}

export function getUserName(userId: string): string | null {
  const user = usersMap.get(userId);
  return user?.name ?? null;
}

export function clearUsersMap(): void {
  usersMap.clear();
}
