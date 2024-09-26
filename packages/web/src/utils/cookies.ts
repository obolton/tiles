export function getCookie(name: string) {
  const cookies = document.cookie.split(";");
  for (const cookie of cookies) {
    const [cookieName, value = ""] = cookie.trim().split("=");
    if (cookieName === name) {
      return decodeURIComponent(value);
    }
  }
  return null;
}
