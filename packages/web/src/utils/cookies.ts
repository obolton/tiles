import { parseCookie } from "cookie";

export function getCookie(cookieString: string, name: string) {
  return parseCookie(cookieString)[name] ?? null;
}
