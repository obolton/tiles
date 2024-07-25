import cookie from "cookie";
export function getCookie(cookieString: string, name: string) {
  return cookie.parse(cookieString)[name] ?? null;
}
