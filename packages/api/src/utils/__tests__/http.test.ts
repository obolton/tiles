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

describe("getStream request", () => {
  test("requests the accepted content types", async () => {
    const fetchMock = vi.fn(
      async () =>
        new Response(new ReadableStream(), {
          headers: { "Content-Type": "image/png" },
        }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await getStream("https://example.com/stream", ["image/jpeg", "image/png"]);

    expect(fetchMock).toHaveBeenCalledExactlyOnceWith("https://example.com/stream", {
      headers: { Accept: "image/jpeg, image/png" },
    });
  });

  test("normalizes the content type to lower case", async () => {
    vi.stubGlobal(
      "fetch",
      async () =>
        new Response(new ReadableStream(), {
          headers: { "Content-Type": "IMAGE/JPEG" },
        }),
    );

    const { contentType } = await getStream("https://example.com/stream", ["image/jpeg"]);

    expect(contentType).toBe("image/jpeg");
  });

  test("throws an error if the response is not OK", async () => {
    vi.stubGlobal(
      "fetch",
      async () =>
        new Response("missing", {
          status: 404,
          statusText: "Not Found",
          headers: { "Content-Type": "image/jpeg" },
        }),
    );

    await expect(getStream("https://example.com/stream", ["image/jpeg"])).rejects.toThrow(
      "getStream: 404: Not Found",
    );
  });

  test("propagates network failures", async () => {
    vi.stubGlobal("fetch", async () => {
      throw new TypeError("fetch failed");
    });

    await expect(getStream("https://example.com/stream", ["image/jpeg"])).rejects.toThrow(
      "fetch failed",
    );
  });
});
