import { initializeSession, user, type User } from "@/utils/sessions";
import { initializeCache, setWorkspaceId } from "@/utils/cache";

export function initRoute(workspaceId?: string, userData?: User | null) {
  initializeSession(userData);

  if (!workspaceId) {
    return;
  }

  setWorkspaceId(workspaceId);

  // Without a user yet, as on the first page load after signing in, the cache works from memory
  // and the network for this page load.
  if (user.value) {
    void initializeCache(user.value.id, workspaceId);
  }
}
