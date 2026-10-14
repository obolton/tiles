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

const IMAGE_BYTES: Record<string, number[]> = {
  "image/jpeg": [0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01],
  "image/png": [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d],
  "image/gif": [0x47, 0x49, 0x46, 0x38, 0x39, 0x61, 0x01, 0x00, 0x01, 0x00, 0x00, 0x00],
  "image/webp": [0x52, 0x49, 0x46, 0x46, 0x24, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50],
};

/** Leading bytes of a valid image of the given type (JPEG by default). */
export function imageBytes(contentType = "image/jpeg"): Uint8Array {
  const mimeType = contentType.split(";")[0]?.trim().toLowerCase() ?? "";
  return new Uint8Array(IMAGE_BYTES[mimeType] ?? IMAGE_BYTES["image/jpeg"] ?? []);
}

export function imageResponse(
  contentType = "image/jpeg",
  {
    status = 200,
    contentLength,
    body = imageBytes(contentType),
  }: {
    status?: number;
    contentLength?: string;
    body?: Uint8Array | ReadableStream<Uint8Array> | null;
  } = {},
): Response {
  const headers: Record<string, string> = { "Content-Type": contentType };
  if (contentLength) {
    headers["Content-Length"] = contentLength;
  }
  return new Response(body, { status, headers });
}

export function redirectResponse(location: string, status = 302): Response {
  return new Response(null, { status, headers: { Location: location } });
}
