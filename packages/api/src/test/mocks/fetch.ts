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
