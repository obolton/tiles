import { redirect } from "@/router/router";
import { getSessionId } from "@/utils/sessions";
import type { IncomingMessage } from "node:http";

export function authenticatedRoute(request: IncomingMessage) {
  const sessionId = getSessionId(request.headers);
  if (!sessionId) {
    return redirect("/sign-in", 302);
  }
}
