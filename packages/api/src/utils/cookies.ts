import { stringifySetCookie, parseCookie } from "cookie";
import { SESSION_COOKIE_NAME } from "@/constants/cookies";
import { env } from "@/env";
import type { ServerResponse } from "node:http";

export function getCookie(cookieString: string, name: string) {
  return parseCookie(cookieString)[name] ?? null;
}

export function clearSessionCookie(res: ServerResponse) {
  res.setHeader(
    "Set-Cookie",
    stringifySetCookie({
      name: SESSION_COOKIE_NAME,
      value: "",
      domain: env.PUBLIC_SESSION_COOKIE_DOMAIN,
      path: "/",
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      maxAge: 0,
    }),
  );
}
