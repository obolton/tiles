import client from "@/api/client";
import { get, set, remove } from "./state";
import type { AppRouterOutputs } from "@/api/client";

export type WorkspaceTheme = AppRouterOutputs["themes"]["list"][number];

function getCacheKey(workspaceId: string) {
  return `themes:${workspaceId}`;
}

export function getCachedWorkspaceThemes(workspaceId: string) {
  return get<WorkspaceTheme[]>(getCacheKey(workspaceId));
}

export async function getWorkspaceThemes(workspaceId: string) {
  const cached = getCachedWorkspaceThemes(workspaceId);
  if (cached) {
    return cached;
  }

  const result = await client.themes.list.query({ workspaceId });
  set(getCacheKey(workspaceId), result);
  return result;
}

export function invalidateWorkspaceThemes(workspaceId: string) {
  remove(getCacheKey(workspaceId));
}
