export type RedirectStatusCode = 301 | 302 | 307 | 308;

export function redirect(
  location: string,
  status: RedirectStatusCode = 301,
  additionalHeaders?: HeadersInit,
) {
  const headers = new Headers(additionalHeaders);
  headers.set("Location", location);
  return new Response(null, {
    status,
    headers,
  });
}
