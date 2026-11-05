import { redirect } from "@/router/responses";
import { getPathDestination, withDestination } from "@/auth/destinations";
import { getSessionId } from "@/utils/sessions";

export function authenticatedRoute(request: Request) {
  const sessionId = getSessionId(request.headers);
  if (!sessionId) {
    const destination = getPathDestination(new URL(request.url).pathname);
    return redirect(withDestination("/sign-in", destination), 302);
  }
}
