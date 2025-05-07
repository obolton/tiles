import { redirect } from "@/router/router";
import { getSessionId } from "@/utils/sessions";

export function authenticatedRoute(request: Request) {
  const sessionId = getSessionId(request.headers);
  if (!sessionId) {
    return redirect("/sign-in", 302);
  }
}
