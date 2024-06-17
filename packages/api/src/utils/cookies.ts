export function getCookie(cookieString: string, name: string) {
  const cookies = cookieString.split(";");
  for (const cookie of cookies) {
    const [cookieName, value] = cookie.trim().split("=");
    if (cookieName === name) {
      return decodeURIComponent(value);
    }
  }
  return null;
}
