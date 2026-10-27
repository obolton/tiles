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

describe("getLinkMetadata (document parsing)", () => {
  test("returns null and logs when the response has no body", async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(null, { status: 200, headers: { "Content-Type": "text/html" } }),
    );
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const metadata = await getLinkMetadata("https://example.com/empty");

    expect(metadata).toBeNull();
    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining("No content returned"));
  });

  test("returns null and logs when the fetch rejects", async () => {
    vi.mocked(fetch).mockRejectedValueOnce(new Error("Network error"));
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const metadata = await getLinkMetadata("https://example.com/offline");

    expect(metadata).toBeNull();
    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining("Network error"));
  });

  test("accepts HTML content types with parameters", async () => {
    vi.mocked(fetch).mockResolvedValue(
      htmlResponse("<html><head><title>Charset</title></head></html>", "text/html; charset=utf-8"),
    );

    const metadata = await getLinkMetadata("https://example.com/charset");

    expect(metadata?.title).toBe("Charset");
  });

  test("ignores metadata with blank content", async () => {
    const html = `<!doctype html>
    <html>
    <head>
      <title>  Spaced Title  </title>
      <meta name="description" content="   ">
      <meta property="og:title" content=" ">
      <meta property="og:description" content="">
    </head>
    <body></body>
    </html>`;
    vi.mocked(fetch).mockResolvedValue(htmlResponse(html));

    const metadata = await getLinkMetadata("https://example.com/blank");

    expect(metadata).toEqual({
      title: "Spaced Title",
      description: null,
      siteName: null,
      imageUrl: null,
    });
  });

  test("returns null fields when the head contains no metadata", async () => {
    vi.mocked(fetch).mockResolvedValue(htmlResponse("<html><head></head><body></body></html>"));

    const metadata = await getLinkMetadata("https://example.com/bare");

    expect(metadata).toEqual({ title: null, description: null, siteName: null, imageUrl: null });
  });

  test("parses a document streamed in multiple chunks", async () => {
    const chunks = [
      "<html><head><title>Multi",
      'part</title><meta property="og:site_name" con',
      'tent="Site"></head><body>',
      '<meta property="og:title" content="Ignored"></body></html>',
    ];
    const body = new ReadableStream({
      async start(controller) {
        for (const chunk of chunks) {
          controller.enqueue(new TextEncoder().encode(chunk));
          await new Promise((resolve) => setTimeout(resolve, 1));
        }
        controller.close();
      },
    });
    vi.mocked(fetch).mockResolvedValue(
      new Response(body, { status: 200, headers: { "Content-Type": "text/html" } }),
    );

    const metadata = await getLinkMetadata("https://example.com/chunked");

    expect(metadata).toEqual({
      title: "Multipart",
      description: null,
      siteName: "Site",
      imageUrl: null,
    });
  });

  test("parses an implicitly closed head", async () => {
    vi.mocked(fetch).mockResolvedValue(
      htmlResponse("<html><head><title>Implicit</title><body><p>Body</p></body></html>"),
    );

    const metadata = await getLinkMetadata("https://example.com/implicit");

    expect(metadata?.title).toBe("Implicit");
  });
});
