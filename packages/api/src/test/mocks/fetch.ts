import { vi } from "vitest";

export function jsonResponse(body: unknown, init?: ResponseInit): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "Content-Type": "application/json" },
    ...init,
  });
}

export function fetchedUrl(): URL {
  const [input] = vi.mocked(fetch).mock.lastCall ?? [];
  return new URL(input instanceof Request ? input.url : (input ?? ""));
}

export function htmlResponse(html: string, contentType = "text/html"): Response {
  return new Response(html, {
    status: 200,
    headers: { "Content-Type": contentType },
  });
}

export function imageResponse(
  contentType = "image/jpeg",
  { status = 200, contentLength }: { status?: number; contentLength?: string } = {},
): Response {
  const headers: Record<string, string> = { "Content-Type": contentType };
  if (contentLength) {
    headers["Content-Length"] = contentLength;
  }
  return new Response(new Uint8Array([0xff, 0xd8]), { status, headers });
}
