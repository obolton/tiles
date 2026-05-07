import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import {
  getVariableFontUrl,
  fetchFontMetadata,
  fetchVariableFontMetadata,
  getFontFilename,
} from "../fontsource";

const VALID_RESPONSE = {
  family: "Inter",
  version: "v20",
  styles: ["normal", "italic"],
  variants: {
    "400": {
      normal: {
        latin: { url: { woff2: "https://example.com/inter-400-normal.woff2" } },
      },
    },
  },
};

const VALID_VARIABLE_RESPONSE = {
  family: "Inter",
  axes: {
    wght: { default: "400", min: "100", max: "900", step: "1" },
    opsz: { default: "14", min: "14", max: "32", step: "0.1" },
  },
};

describe("fetchFontMetadata", () => {
  beforeEach(() => {
    vi.spyOn(global, "fetch");
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  test("requests the per-font endpoint by id", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify(VALID_RESPONSE), { status: 200 }),
    );

    await fetchFontMetadata("inter");

    expect(fetch).toHaveBeenCalledWith(
      "https://api.fontsource.org/v1/fonts/inter",
    );
  });

  test("parses a well-formed response", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify(VALID_RESPONSE), { status: 200 }),
    );

    const meta = await fetchFontMetadata("inter");

    expect(meta.family).toBe("Inter");
    expect(meta.version).toBe("v20");
    expect(meta.styles).toEqual(["normal", "italic"]);
    expect(meta.variants["400"]?.normal?.latin?.url.woff2).toBe(
      "https://example.com/inter-400-normal.woff2",
    );
  });

  test("throws on a non-OK response", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response("not found", { status: 404 }),
    );

    await expect(fetchFontMetadata("nope")).rejects.toThrow(
      "Fontsource API returned 404 for nope",
    );
  });

  test("throws when the response shape is invalid", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify({ wrong: "shape" }), { status: 200 }),
    );

    await expect(fetchFontMetadata("inter")).rejects.toThrow();
  });

  test("throws when a variant is missing the woff2 url", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          ...VALID_RESPONSE,
          variants: { "400": { normal: { latin: { url: {} } } } },
        }),
        { status: 200 },
      ),
    );

    await expect(fetchFontMetadata("inter")).rejects.toThrow();
  });
});

describe("fetchVariableFontMetadata", () => {
  beforeEach(() => {
    vi.spyOn(global, "fetch");
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  test("requests the variable endpoint by id", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify(VALID_VARIABLE_RESPONSE), { status: 200 }),
    );

    await fetchVariableFontMetadata("inter");

    expect(fetch).toHaveBeenCalledWith(
      "https://api.fontsource.org/v1/variable/inter",
    );
  });

  test("parses a well-formed response", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify(VALID_VARIABLE_RESPONSE), { status: 200 }),
    );

    const meta = await fetchVariableFontMetadata("inter");

    expect(meta?.family).toBe("Inter");
    expect(meta?.axes.wght).toEqual({
      default: "400",
      min: "100",
      max: "900",
      step: "1",
    });
  });

  test("returns null on 404", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response("not found", { status: 404 }),
    );

    expect(await fetchVariableFontMetadata("not-variable")).toBeNull();
  });

  test("throws on a non-404 error response", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response("server error", { status: 500 }),
    );

    await expect(fetchVariableFontMetadata("inter")).rejects.toThrow(
      "Fontsource variable API returned 500 for inter",
    );
  });
});

describe("getFontFilename", () => {
  test("formats a static filename with a numeric weight", () => {
    expect(getFontFilename("latin", 400, "normal")).toBe(
      "latin-400-normal.woff2",
    );
  });

  test("formats a variable filename with the wght axis name", () => {
    expect(getFontFilename("latin", "wght", "italic")).toBe(
      "latin-wght-italic.woff2",
    );
  });
});

describe("getVariableFontUrl", () => {
  test("constructs a :vf CDN URL pinned to @latest", () => {
    expect(getVariableFontUrl("inter", "latin", "normal")).toBe(
      "https://cdn.jsdelivr.net/fontsource/fonts/inter:vf@latest/latin-wght-normal.woff2",
    );
  });
});
