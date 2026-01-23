import cookie from "cookie";
import { SESSION_COOKIE_NAME } from "@/constants/cookies.ts";
import type { ServerResponse, IncomingMessage } from "node:http";

export function getCookie(cookieString: string, name: string) {
  return cookie.parse(cookieString)[name] ?? null;
}

export function clearSessionCookie(res: ServerResponse<IncomingMessage>) {
  res.setHeader(
    "Set-Cookie",
    cookie.serialize(SESSION_COOKIE_NAME, "", {
      domain: process.env.PUBLIC_SESSION_COOKIE_DOMAIN,
      path: "/",
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      maxAge: 0,
    }),
  );
}
