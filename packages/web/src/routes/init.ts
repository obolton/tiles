import { initializeSession, isSignedIn, user, type User } from "@/utils/sessions";
import { initializeCache } from "@/utils/cache";

export function initRoute(workspaceId?: string, userData?: User | null) {
  initializeSession(userData);

  if (!workspaceId) {
    return;
  }

  if (user.value) {
    void initializeCache(user.value.id, workspaceId);
    return;
  }

  if (!isSignedIn()) {
    return;
  }

  // Without a cached user, as on the first page load after signing in, the user only arrives
  // with the session's background refresh.
  const controller = new AbortController();
  user.subscribe(({ value }) => {
    if (value) {
      controller.abort();
      void initializeCache(value.id, workspaceId);
    }
  }, controller.signal);
}
