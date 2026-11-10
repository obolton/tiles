import { initializeSession, user, type User } from "@/utils/sessions";
import { initializeCache } from "@/utils/cache";

export function initRoute(workspaceId?: string, userData?: User | null) {
  initializeSession(userData);

  if (user.value && workspaceId) {
    void initializeCache(user.value.id, workspaceId);
  }
}
