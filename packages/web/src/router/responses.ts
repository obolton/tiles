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

export function forbidden(headers?: HeadersInit) {
  return new Response(null, {
    status: 403,
    statusText: "Forbidden",
    headers,
  });
}

export function notFound(headers?: HeadersInit) {
  return new Response("Not Found", {
    status: 404,
    statusText: "Not Found",
    headers,
  });
}

export function internalError(body: string = "Internal Server Error", headers?: HeadersInit) {
  return new Response(body, {
    status: 500,
    statusText: "Internal Server Error",
    headers,
  });
}
