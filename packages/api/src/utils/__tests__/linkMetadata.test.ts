import { afterEach, describe, expect, test, vi } from "vitest";
import { getLinkMetadata } from "../linkMetadata.ts";

describe("getLinkMetadata", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  test("prefers Open Graph fields and forwards headers", async () => {
    const html = `<!doctype html>
    <html>
    <head>
      <title>Fallback Title</title>
      <meta name="description" content="Fallback description">
      <meta property="og:title" content="OG Title">
      <meta property="og:description" content="OG Description">
      <meta property="og:site_name" content="OG Site">
      <meta property="og:image" content="https://example.com/image.png">
    </head>
    <body></body>
    </html>`;
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response(html, { status: 200 }));

    const metadata = await getLinkMetadata(
      "https://example.com/page",
      "es-ES,es",
    );

    expect(metadata).toEqual({
      title: "OG Title",
      description: "OG Description",
      siteName: "OG Site",
      imageUrl: "https://example.com/image.png",
    });
    expect(fetchMock).toHaveBeenCalledWith("https://example.com/page", {
      headers: {
        Accept: "text/html,application/xhtml+xml,application/xml",
        "Accept-Language": "es-ES,es",
        "User-Agent": "facebookexternalhit/1.1",
      },
    });
  });

  test("falls back to standard metadata when Open Graph tags are missing", async () => {
    const html = `<!doctype html>
    <html>
    <head>
    <title>Plain Title</title>
    <meta name="description" content="Plain description">
    </head>
    <body></body>
    </html>`;
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(html, { status: 200 }),
    );

    const metadata = await getLinkMetadata("https://example.com/plain");

    expect(metadata).toEqual({
      title: "Plain Title",
      description: "Plain description",
      siteName: null,
      imageUrl: null,
    });
  });

  test("returns null and logs on fetch failure", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response("fail", {
        status: 502,
        statusText: "Bad Gateway",
      }),
    );
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const metadata = await getLinkMetadata("https://example.com/error");

    expect(metadata).toBeNull();
    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining(
        "Failed to fetch metadata for https://example.com/error",
      ),
    );
  });
});
