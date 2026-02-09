import { getSessionId } from "./sessions";

export function getLoaderContext(headers?: Headers) {
  if (import.meta.env.SSR && headers) {
    const sessionId = getSessionId(headers);
    return sessionId ? { context: { sessionId } } : {};
  }
  return {};
}
