import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

vi.mock("../fontsource", async () => {
  const actual = await vi.importActual<typeof import("../fontsource")>("../fontsource");
  return {
    ...actual,
    fetchFontMetadata: vi.fn(),
    fetchVariableFontMetadata: vi.fn(),
  };
});

vi.mock("subset-font", () => ({
  default: vi.fn(),
}));

import subsetFont from "subset-font";
import type { FontConfig } from "../config";
import type { FontBucket } from "../storage";
import {
  fetchFontMetadata,
  fetchVariableFontMetadata,
  type FontsourceFont,
  type FontsourceVariableFont,
} from "../fontsource";
import { syncFonts, type FontProgress } from "../sync";

const WOFF2_OPTIONS = {
  httpMetadata: {
    contentType: "font/woff2",
    cacheControl: "public, max-age=31536000, immutable",
  },
};

const head = vi.fn<FontBucket["head"]>();
const put = vi.fn<FontBucket["put"]>();
const bucket: FontBucket = { head, put };

const FONT_INTER: FontConfig = {
  id: "inter",
  family: "Inter",
  previewFamily: "Inter Preview",
  category: "sans-serif",
  fallback: "sans-serif",
  weights: [400, 700],
};

const FONTSOURCE_META: FontsourceFont = {
  family: "Inter",
  version: "v20",
  styles: ["normal", "italic"],
  variants: {
    "400": { normal: { latin: {} }, italic: { latin: {} } },
    "700": { normal: { latin: {} }, italic: { latin: {} } },
  },
};

const VARIABLE_META: FontsourceVariableFont = {
  family: "Inter",
  axes: {
    wght: { default: "400", min: "100", max: "900", step: "1" },
  },
};

describe("syncFonts", () => {
  beforeEach(() => {
    vi.mocked(fetchFontMetadata).mockReset();
    vi.mocked(fetchVariableFontMetadata).mockReset();
    vi.mocked(fetchVariableFontMetadata).mockResolvedValue(null);
    head.mockReset();
    put.mockReset();
    vi.mocked(subsetFont).mockReset();
    vi.mocked(subsetFont).mockResolvedValue(Buffer.from([0x77, 0xff]));
    vi.spyOn(global, "fetch").mockImplementation(
      async () => new Response(new Uint8Array([0, 1, 2]), { status: 200 }),
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  test("uploads variants that don't yet exist in the bucket", async () => {
    vi.mocked(fetchFontMetadata).mockResolvedValue(FONTSOURCE_META);
    head.mockResolvedValue(null);

    const result = await syncFonts(bucket, [FONT_INTER]);

    expect(put).toHaveBeenCalledWith(
      "inter/inter-latin-400-normal.woff2",
      expect.anything(),
      expect.anything(),
    );
    expect(result.uploaded).toBe(5);
    expect(result.skipped).toBe(0);
  });

  test("skips variants that already exist in the bucket", async () => {
    vi.mocked(fetchFontMetadata).mockResolvedValue(FONTSOURCE_META);
    head.mockResolvedValue({});

    const result = await syncFonts(bucket, [FONT_INTER]);

    expect(put).not.toHaveBeenCalled();
    expect(fetch).not.toHaveBeenCalled();
    expect(result.uploaded).toBe(0);
    expect(result.skipped).toBe(5);
  });

  test("only processes weights that are configured for the font", async () => {
    vi.mocked(fetchFontMetadata).mockResolvedValue({
      ...FONTSOURCE_META,
      variants: {
        "100": { normal: { latin: {} } },
        "400": { normal: { latin: {} } },
        "900": { normal: { latin: {} } },
      },
    });
    head.mockResolvedValue({});

    await syncFonts(bucket, [{ ...FONT_INTER, weights: [400] }]);

    expect(head).toHaveBeenCalledWith("inter/inter-latin-400-normal.woff2");
    expect(head).not.toHaveBeenCalledWith(expect.stringContaining("100"));
    expect(head).not.toHaveBeenCalledWith(expect.stringContaining("900"));
  });

  test("skips styles that have no woff2 url for the latin subset", async () => {
    vi.mocked(fetchFontMetadata).mockResolvedValue({
      ...FONTSOURCE_META,
      family: "Quicksand",
      variants: {
        "400": { normal: { latin: {} } },
      },
    });
    head.mockResolvedValue({});

    const result = await syncFonts(bucket, [{ ...FONT_INTER, weights: [400] }]);

    expect(result.skipped).toBe(2);
  });

  test("uploads with the correct key, content type, and cache header", async () => {
    vi.mocked(fetchFontMetadata).mockResolvedValue({
      ...FONTSOURCE_META,
      variants: {
        "400": { normal: { latin: {} } },
      },
    });
    head.mockResolvedValue(null);

    await syncFonts(bucket, [{ ...FONT_INTER, weights: [400] }]);

    expect(put).toHaveBeenCalledWith(
      "inter/inter-latin-400-normal.woff2",
      expect.any(ArrayBuffer),
      WOFF2_OPTIONS,
    );
  });

  test("invokes onProgress once per font with flat counts", async () => {
    vi.mocked(fetchFontMetadata).mockResolvedValue(FONTSOURCE_META);
    head.mockResolvedValue({});

    const progress: FontProgress[] = [];
    await syncFonts(bucket, [FONT_INTER], (p) => progress.push(p));

    expect(progress).toEqual([{ id: "inter", files: 5, uploaded: 0, skipped: 5 }]);
  });

  test("builds a manifest with sorted file lists", async () => {
    vi.mocked(fetchFontMetadata).mockResolvedValue(FONTSOURCE_META);
    head.mockResolvedValue({});

    const { manifest } = await syncFonts(bucket, [FONT_INTER]);

    expect(manifest).toEqual({
      fonts: {
        inter: {
          family: "Inter",
          version: "v20",
          files: [
            {
              weight: 400,
              style: "italic",
              subset: "latin",
              path: "inter/inter-latin-400-italic.woff2",
            },
            {
              weight: 400,
              style: "normal",
              subset: "latin",
              path: "inter/inter-latin-400-normal.woff2",
            },
            {
              weight: 700,
              style: "italic",
              subset: "latin",
              path: "inter/inter-latin-700-italic.woff2",
            },
            {
              weight: 700,
              style: "normal",
              subset: "latin",
              path: "inter/inter-latin-700-normal.woff2",
            },
          ],
          previewPath: "inter/inter-preview.woff2",
        },
      },
    });
  });

  test("aggregates totals across multiple fonts", async () => {
    vi.mocked(fetchFontMetadata).mockResolvedValueOnce(FONTSOURCE_META);
    vi.mocked(fetchFontMetadata).mockResolvedValueOnce({
      ...FONTSOURCE_META,
      family: "Lora",
    });
    head
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({})
      .mockResolvedValue({});

    const result = await syncFonts(bucket, [
      FONT_INTER,
      { ...FONT_INTER, id: "lora", family: "Lora" },
    ]);

    expect(result.uploaded).toBe(2);
    expect(result.skipped).toBe(8);
    expect(Object.keys(result.manifest.fonts)).toEqual(["inter", "lora"]);
  });

  test("propagates a failed download", async () => {
    vi.mocked(fetchFontMetadata).mockResolvedValue(FONTSOURCE_META);
    head.mockResolvedValue(null);
    vi.mocked(fetch).mockResolvedValue(new Response(null, { status: 503 }));

    await expect(syncFonts(bucket, [FONT_INTER])).rejects.toThrow("Failed to fetch");
    expect(put).not.toHaveBeenCalled();
  });

  describe("variable fonts", () => {
    test("syncs one variable file per available style with a weight range", async () => {
      vi.mocked(fetchFontMetadata).mockResolvedValue(FONTSOURCE_META);
      vi.mocked(fetchVariableFontMetadata).mockResolvedValue(VARIABLE_META);
      head.mockResolvedValue(null);

      const { manifest } = await syncFonts(bucket, [FONT_INTER]);

      expect(manifest.fonts.inter).toEqual({
        family: "Inter",
        version: "v20",
        files: [
          {
            weight: { min: 100, max: 900 },
            style: "italic",
            subset: "latin",
            path: "inter/inter-latin-wght-italic.woff2",
          },
          {
            weight: { min: 100, max: 900 },
            style: "normal",
            subset: "latin",
            path: "inter/inter-latin-wght-normal.woff2",
          },
        ],
        previewPath: "inter/inter-preview.woff2",
      });
    });

    test("fetches from the Fontsource :vf CDN URL", async () => {
      vi.mocked(fetchFontMetadata).mockResolvedValue(FONTSOURCE_META);
      vi.mocked(fetchVariableFontMetadata).mockResolvedValue(VARIABLE_META);
      head.mockResolvedValue(null);

      await syncFonts(bucket, [FONT_INTER]);

      expect(fetch).toHaveBeenCalledWith(
        "https://cdn.jsdelivr.net/fontsource/fonts/inter:vf@latest/latin-wght-normal.woff2",
      );
      expect(fetch).toHaveBeenCalledWith(
        "https://cdn.jsdelivr.net/fontsource/fonts/inter:vf@latest/latin-wght-italic.woff2",
      );
    });

    test("only syncs styles that the font ships in", async () => {
      vi.mocked(fetchFontMetadata).mockResolvedValue({
        ...FONTSOURCE_META,
        family: "Caveat",
        styles: ["normal"],
      });
      vi.mocked(fetchVariableFontMetadata).mockResolvedValue({
        ...VARIABLE_META,
        family: "Caveat",
      });
      head.mockResolvedValue(null);

      const { manifest } = await syncFonts(bucket, [FONT_INTER]);

      expect(manifest.fonts.inter?.files).toHaveLength(1);
      expect(manifest.fonts.inter?.files[0]?.style).toBe("normal");
    });

    test("falls back to static when the variable response has no wght axis", async () => {
      vi.mocked(fetchFontMetadata).mockResolvedValue(FONTSOURCE_META);
      vi.mocked(fetchVariableFontMetadata).mockResolvedValue({
        ...VARIABLE_META,
        axes: { ital: { default: "0", min: "0", max: "1", step: "1" } },
      });
      head.mockResolvedValue({});

      const { manifest } = await syncFonts(bucket, [FONT_INTER]);

      expect(manifest.fonts.inter?.files).toHaveLength(4);
      expect(manifest.fonts.inter?.files[0]?.weight).toBe(400);
    });

    test("falls back to static when the variable endpoint 404s", async () => {
      vi.mocked(fetchFontMetadata).mockResolvedValue(FONTSOURCE_META);
      vi.mocked(fetchVariableFontMetadata).mockResolvedValue(null);
      head.mockResolvedValue({});

      const { manifest } = await syncFonts(bucket, [FONT_INTER]);

      expect(manifest.fonts.inter?.files).toHaveLength(4);
      expect(manifest.fonts.inter?.files[0]?.weight).toBe(400);
    });

    test("supports a mixed registry of variable and static fonts", async () => {
      vi.mocked(fetchFontMetadata)
        .mockResolvedValueOnce(FONTSOURCE_META)
        .mockResolvedValueOnce({
          ...FONTSOURCE_META,
          family: "Pacifico",
          styles: ["normal"],
        });
      vi.mocked(fetchVariableFontMetadata)
        .mockResolvedValueOnce(VARIABLE_META)
        .mockResolvedValueOnce(null);
      head.mockResolvedValue({});

      const { manifest } = await syncFonts(bucket, [
        FONT_INTER,
        { ...FONT_INTER, id: "pacifico", family: "Pacifico", weights: [400] },
      ]);

      expect(manifest.fonts.inter?.files[0]?.weight).toEqual({
        min: 100,
        max: 900,
      });
      expect(manifest.fonts.pacifico?.files[0]?.weight).toBe(400);
    });
  });

  describe("preview", () => {
    test("subsets the family name from a static font and uploads it", async () => {
      vi.mocked(fetchFontMetadata).mockResolvedValue(FONTSOURCE_META);
      head.mockResolvedValue(null);
      vi.mocked(subsetFont).mockResolvedValue(Buffer.from([0x77, 0xff]));

      const { manifest } = await syncFonts(bucket, [FONT_INTER]);

      expect(subsetFont).toHaveBeenCalledWith(
        expect.any(Buffer),
        "Inter",
        expect.objectContaining({ targetFormat: "woff2" }),
      );
      expect(put).toHaveBeenCalledWith(
        "inter/inter-preview.woff2",
        expect.any(Buffer),
        WOFF2_OPTIONS,
      );
      expect(manifest.fonts.inter?.previewPath).toBe("inter/inter-preview.woff2");
    });

    test("pins the wght axis to its default for variable fonts", async () => {
      vi.mocked(fetchFontMetadata).mockResolvedValue(FONTSOURCE_META);
      vi.mocked(fetchVariableFontMetadata).mockResolvedValue(VARIABLE_META);
      head.mockResolvedValue(null);
      vi.mocked(subsetFont).mockResolvedValue(Buffer.from([0x77, 0xff]));

      await syncFonts(bucket, [FONT_INTER]);

      expect(subsetFont).toHaveBeenCalledWith(
        expect.any(Buffer),
        "Inter",
        expect.objectContaining({ variationAxes: { wght: 400 } }),
      );
    });

    test("skips the upload when the preview already exists in the bucket", async () => {
      vi.mocked(fetchFontMetadata).mockResolvedValue(FONTSOURCE_META);
      head.mockResolvedValue({});

      const { manifest } = await syncFonts(bucket, [FONT_INTER]);

      expect(subsetFont).not.toHaveBeenCalled();
      expect(put).not.toHaveBeenCalledWith(
        "inter/inter-preview.woff2",
        expect.anything(),
        expect.anything(),
      );
      expect(manifest.fonts.inter?.previewPath).toBe("inter/inter-preview.woff2");
    });

    test("propagates the subsetting error", async () => {
      vi.mocked(fetchFontMetadata).mockResolvedValue(FONTSOURCE_META);
      head.mockImplementation(async (key) => (key.endsWith("-preview.woff2") ? null : {}));
      vi.mocked(subsetFont).mockRejectedValue(new Error("bad font"));

      await expect(syncFonts(bucket, [FONT_INTER])).rejects.toThrow("bad font");
    });
  });
});
