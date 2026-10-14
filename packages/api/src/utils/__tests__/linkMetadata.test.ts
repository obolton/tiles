import { afterEach, describe, expect, test, vi } from "vitest";
import { htmlResponse, redirectResponse } from "@/test/mocks/fetch";
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
      redirect: "manual",
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

  test("rejects private destinations without fetching", async () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const metadata = await getLinkMetadata("http://169.254.169.254/latest/meta-data/");

    expect(metadata).toBeNull();
    expect(fetch).not.toHaveBeenCalled();
    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining("Disallowed address"));
  });

  test("rejects redirects to private destinations", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(redirectResponse("http://localhost:5432/"));
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const metadata = await getLinkMetadata("https://example.com/redirect");

    expect(metadata).toBeNull();
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining("Disallowed host"));
  });

  test("gives up on documents larger than the byte limit", async () => {
    const body = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(new TextEncoder().encode("<!doctype html><html><head><title>Big"));
      },
      pull(controller) {
        controller.enqueue(new Uint8Array(1024 * 1024).fill(0x20));
      },
    });
    vi.mocked(fetch).mockResolvedValue(
      new Response(body, { status: 200, headers: { "Content-Type": "text/html" } }),
    );
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const metadata = await getLinkMetadata("https://example.com/huge");

    expect(metadata).toBeNull();
    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining("exceeded the limit"));
  });

  test("resolves when the document has no head element", async () => {
    vi.mocked(fetch).mockResolvedValue(htmlResponse("<p>No head here</p>"));

    const metadata = await getLinkMetadata("https://example.com/fragment");

    expect(metadata).toEqual({ title: null, description: null, siteName: null, imageUrl: null });
  });

  test("stops reading the body once the head has been parsed", async () => {
    let cancelled = false;
    const body = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(
          new TextEncoder().encode("<!doctype html><html><head><title>Done</title></head><body>"),
        );
      },
      pull(controller) {
        controller.enqueue(new TextEncoder().encode("<p>more</p>"));
      },
      cancel() {
        cancelled = true;
      },
    });
    vi.mocked(fetch).mockResolvedValue(
      new Response(body, { status: 200, headers: { "Content-Type": "text/html" } }),
    );

    const metadata = await getLinkMetadata("https://example.com/long");

    expect(metadata?.title).toBe("Done");
    await vi.waitFor(() => expect(cancelled).toBe(true));
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
