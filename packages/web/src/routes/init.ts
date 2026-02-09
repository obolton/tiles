import { initializeSession, user } from "@/utils/sessions";
import { initializeCache } from "@/utils/cache";

export function initRoute(workspaceId?: string) {
  initializeSession();

  if (user.value && workspaceId) {
    initializeCache(user.value.id, workspaceId);
  }
}
