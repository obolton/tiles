import { describe, expect, test, vi } from "vitest";
import { ReadableStream } from "node:stream/web";
import { getStream } from "../http";

describe("getStream", () => {
  test("returns a stream and content type", async () => {
    vi.stubGlobal(
      "fetch",
      async () =>
        new Response(new ReadableStream(), {
          headers: {
            "Content-Type": "image/jpeg",
          },
        }),
    );
    const { stream, contentType } = await getStream("https://example.com/stream", ["image/jpeg"]);
    expect(stream).toBeInstanceOf(ReadableStream);
    expect(contentType).toBe("image/jpeg");
  });

  test("throws an error if the response does not include a content type", async () => {
    vi.stubGlobal(
      "fetch",
      async () =>
        new Response(new ReadableStream(), {
          headers: {},
        }),
    );
    await expect(getStream("https://example.com/stream", ["image/jpeg"])).rejects.toThrow(
      "getStream: No Content-Type header.",
    );
  });

  test("throws an error if the response has an unexpected content type", async () => {
    vi.stubGlobal(
      "fetch",
      async () =>
        new Response(new ReadableStream(), {
          headers: {
            "Content-Type": "text/plain",
          },
        }),
    );
    await expect(getStream("https://example.com/stream", ["image/jpeg"])).rejects.toThrow(
      "getStream: Invalid Content-Type header: text/plain.",
    );
  });

  test("throws an error if the response has no body", async () => {
    vi.stubGlobal(
      "fetch",
      async () => new Response(undefined, { headers: { "Content-Type": "image/jpeg" } }),
    );
    await expect(getStream("https://example.com/stream", ["image/jpeg"])).rejects.toThrow(
      "getStream: No response body.",
    );
  });
});
