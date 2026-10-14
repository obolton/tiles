import { describe, expect, test, vi } from "vitest";
import { htmlResponse } from "@/test/mocks/fetch";
import { getLinkMetadata, matchContentType } from "../linkMetadata";

describe("matchContentType", () => {
  const htmlTypes = ["text/html", "application/xhtml+xml", "application/xml"];

  test("returns true for exact matches", () => {
    expect(matchContentType("text/html", htmlTypes)).toBe(true);
    expect(matchContentType("application/xml", htmlTypes)).toBe(true);
  });

  test("returns false for non-matching types", () => {
    expect(matchContentType("application/json", htmlTypes)).toBe(false);
    expect(matchContentType("image/png", htmlTypes)).toBe(false);
  });

  test("ignores charset and other parameters", () => {
    expect(matchContentType("text/html; charset=utf-8", htmlTypes)).toBe(true);
    expect(matchContentType("text/html;charset=utf-8", htmlTypes)).toBe(true);
  });

  test("is case-insensitive", () => {
    expect(matchContentType("TEXT/HTML", htmlTypes)).toBe(true);
    expect(matchContentType("Text/Html; Charset=UTF-8", htmlTypes)).toBe(true);
  });

  test("trims whitespace", () => {
    expect(matchContentType("  text/html  ", htmlTypes)).toBe(true);
    expect(matchContentType("text/html ; charset=utf-8", htmlTypes)).toBe(true);
  });
});

describe("getLinkMetadata", () => {
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
    vi.mocked(fetch).mockResolvedValue(htmlResponse(html));

    const metadata = await getLinkMetadata("https://example.com/page", "es-ES,es");

    expect(metadata).toEqual({
      title: "OG Title",
      description: "OG Description",
      siteName: "OG Site",
      imageUrl: "https://example.com/image.png",
    });
    expect(fetch).toHaveBeenCalledWith("https://example.com/page", {
      headers: {
        Accept: "text/html,application/xhtml+xml,application/xml",
        "Accept-Language": "es-ES,es",
        "User-Agent": "facebookexternalhit/1.1",
      },
      signal: expect.any(AbortSignal),
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
    vi.mocked(fetch).mockResolvedValue(htmlResponse(html));

    const metadata = await getLinkMetadata("https://example.com/plain");

    expect(metadata).toEqual({
      title: "Plain Title",
      description: "Plain description",
      siteName: null,
      imageUrl: null,
    });
  });

  test("returns null and logs on fetch failure", async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response("fail", {
        status: 502,
        statusText: "Bad Gateway",
      }),
    );
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const metadata = await getLinkMetadata("https://example.com/error");

    expect(metadata).toBeNull();
    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining("Failed to fetch metadata for https://example.com/error"),
    );
  });

  test("returns null and logs on invalid content type", async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response("{}", {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const metadata = await getLinkMetadata("https://example.com/api");

    expect(metadata).toBeNull();
    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining("Invalid content type"));
  });

  test("parses og:image from name attribute", async () => {
    const html = `<!doctype html>
    <html>
    <head>
      <title>Test Page</title>
      <meta name="og:image" content="https://example.com/image.png">
    </head>
    <body></body>
    </html>`;
    vi.mocked(fetch).mockResolvedValue(htmlResponse(html));

    const metadata = await getLinkMetadata("https://example.com/page");

    expect(metadata?.imageUrl).toBe("https://example.com/image.png");
  });

  test("parses og:image:url and og:image:secure_url variants", async () => {
    const html = `<!doctype html>
    <html>
    <head>
      <title>Test Page</title>
      <meta property="og:image:secure_url" content="https://example.com/secure.png">
    </head>
    <body></body>
    </html>`;
    vi.mocked(fetch).mockResolvedValue(htmlResponse(html));

    const metadata = await getLinkMetadata("https://example.com/page");

    expect(metadata?.imageUrl).toBe("https://example.com/secure.png");
  });

  test("prefers og:image over og:image:url variants", async () => {
    const html = `<!doctype html>
    <html>
    <head>
      <title>Test Page</title>
      <meta property="og:image:secure_url" content="https://example.com/secure.png">
      <meta property="og:image" content="https://example.com/canonical.png">
    </head>
    <body></body>
    </html>`;
    vi.mocked(fetch).mockResolvedValue(htmlResponse(html));

    const metadata = await getLinkMetadata("https://example.com/page");

    expect(metadata?.imageUrl).toBe("https://example.com/canonical.png");
  });

  test("resolves relative image URLs to absolute URLs", async () => {
    const html = `<!doctype html>
    <html>
    <head>
      <title>Test Page</title>
      <meta property="og:image" content="/images/og.png">
    </head>
    <body></body>
    </html>`;
    vi.mocked(fetch).mockResolvedValue(htmlResponse(html));

    const metadata = await getLinkMetadata("https://example.com/page");

    expect(metadata?.imageUrl).toBe("https://example.com/images/og.png");
  });

  test("returns null imageUrl for malformed image URLs", async () => {
    const html = `<!doctype html>
    <html>
    <head>
      <title>Test Page</title>
      <meta property="og:image" content="http://[invalid">
    </head>
    <body></body>
    </html>`;
    vi.mocked(fetch).mockResolvedValue(htmlResponse(html));

    const metadata = await getLinkMetadata("https://example.com/page");

    expect(metadata?.title).toBe("Test Page");
    expect(metadata?.imageUrl).toBeNull();
  });
});
