import { describe, expect, test, vi } from "vitest";
import { ReadableStream } from "node:stream/web";
import { imageResponse } from "@/test/mocks/fetch";
import { getStream } from "../http";

describe("getStream", () => {
  test("returns a stream and content type", async () => {
    vi.mocked(fetch).mockResolvedValue(imageResponse("image/jpeg"));

    const { stream, contentType } = await getStream("https://example.com/stream", ["image/jpeg"]);

    expect(stream).toBeInstanceOf(ReadableStream);
    expect(contentType).toBe("image/jpeg");
  });

  test("requests the accepted content types", async () => {
    vi.mocked(fetch).mockResolvedValue(imageResponse("image/png"));

    await getStream("https://example.com/stream", ["image/jpeg", "image/png"]);

    expect(fetch).toHaveBeenCalledExactlyOnceWith("https://example.com/stream", {
      headers: { Accept: "image/jpeg, image/png" },
    });
  });

  test("normalizes the content type to lower case", async () => {
    vi.mocked(fetch).mockResolvedValue(imageResponse("IMAGE/JPEG"));

    const { contentType } = await getStream("https://example.com/stream", ["image/jpeg"]);

    expect(contentType).toBe("image/jpeg");
  });

  test("throws an error if the response is not OK", async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response("missing", { status: 404, statusText: "Not Found" }),
    );

    await expect(getStream("https://example.com/stream", ["image/jpeg"])).rejects.toThrow(
      "getStream: 404: Not Found",
    );
  });

  test("throws an error if the response does not include a content type", async () => {
    vi.mocked(fetch).mockResolvedValue(new Response(new Uint8Array()));

    await expect(getStream("https://example.com/stream", ["image/jpeg"])).rejects.toThrow(
      "getStream: No Content-Type header.",
    );
  });

  test("throws an error if the response has an unexpected content type", async () => {
    vi.mocked(fetch).mockResolvedValue(imageResponse("text/plain"));

    await expect(getStream("https://example.com/stream", ["image/jpeg"])).rejects.toThrow(
      "getStream: Invalid Content-Type header: text/plain.",
    );
  });

  test("throws an error if the response has no body", async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(null, { headers: { "Content-Type": "image/jpeg" } }),
    );

    await expect(getStream("https://example.com/stream", ["image/jpeg"])).rejects.toThrow(
      "getStream: No response body.",
    );
  });

  test("propagates network failures", async () => {
    vi.mocked(fetch).mockRejectedValueOnce(new TypeError("fetch failed"));

    await expect(getStream("https://example.com/stream", ["image/jpeg"])).rejects.toThrow(
      "fetch failed",
    );
  });
});
