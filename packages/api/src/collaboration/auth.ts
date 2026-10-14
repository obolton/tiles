import { getCookie } from "@/utils/cookies";
import { SESSION_COOKIE_NAME } from "@/constants/cookies";
import { getSessionContext } from "@/routes/users/users";
import { getPage } from "@/utils/middleware";

interface AuthenticateConnectionParams {
  requestHeaders: Headers;
  token?: string;
  pageId: string;
}

export async function authenticateConnection({
  requestHeaders,
  token,
  pageId,
}: AuthenticateConnectionParams): Promise<{
  userId: string;
  sessionId: string;
}> {
  const cookieHeader = requestHeaders.get("cookie");
  const sessionId = token || (cookieHeader ? getCookie(cookieHeader, SESSION_COOKIE_NAME) : null);

  if (!sessionId) {
    throw new Error("Missing session");
  }

  const session = await getSessionContext(sessionId);
  if (!session) {
    throw new Error("Invalid session");
  }

  const page = await getPage(session.userId, pageId);
  if (!page) {
    throw new Error("No access to page");
  }

  return { userId: session.userId, sessionId };
}
