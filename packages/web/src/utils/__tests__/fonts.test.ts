import { beforeEach, describe, expect, test, vi } from "vitest";
import {
  clearLoadedFonts,
  clearLoadedPreviews,
  generateFontFaceCSS,
  getFontPreload,
  loadFontPreviews,
  loadFonts,
} from "../fonts";
import type FontFace from "@/test/mocks/FontFace";
import type { FontId } from "api/config/fonts";

function getAddedFaces(): FontFace[] {
  return vi.mocked(document.fonts.add).mock.calls.map(([face]) => face as unknown as FontFace);
}

describe("generateFontFaceCSS", () => {
  describe("with a mixed set of fonts", () => {
    const { content } = generateFontFaceCSS(["inter", "jetbrains-mono", "pt-serif"]);

    test("emits at least one @font-face declaration", () => {
      expect(content.match(/@font-face\{/g)?.length ?? 0).toBeGreaterThan(0);
    });

    test("quotes multi-word family names", () => {
      expect(content).toContain(`font-family:"JetBrains Mono"`);
      expect(content).toContain(`font-family:"PT Serif"`);
    });

    test("includes both styles", () => {
      expect(content).toContain("font-style:normal");
      expect(content).toContain("font-style:italic");
    });

    test("uses font-display: swap", () => {
      expect(content).toContain("font-display:swap");
    });

    test("declares woff2 source format", () => {
      expect(content).toContain(`format("woff2")`);
    });

    test("joins FONTS_BASE_URL with the manifest path", () => {
      expect(content).toContain(
        `src:url("https://test-fonts.example.com/pt-serif/pt-serif-latin-400-normal.woff2")`,
      );
    });
  });

  test("emits a discrete font-weight for static fonts", () => {
    const { content } = generateFontFaceCSS(["pt-serif"]);
    expect(content).toContain("font-weight:400");
    expect(content).toContain("font-weight:700");
  });

  test("emits only the requested subset", () => {
    const { content } = generateFontFaceCSS(["inter"]);
    expect(content).toContain(`font-family:"Inter"`);
    expect(content).not.toContain("Lora");
    expect(content).not.toContain("JetBrains Mono");
  });

  test("silently skips unknown ids", () => {
    const { content } = generateFontFaceCSS(["unknown-font" as FontId]);
    expect(content).toBe("");
  });

  test("accepts a Set as input", () => {
    const { content } = generateFontFaceCSS(new Set<FontId>(["inter"]));
    expect(content).toContain(`font-family:"Inter"`);
  });
});

describe("getFontPreload", () => {
  test("returns a preload Link for a static font's exact weight and style", () => {
    expect(getFontPreload("pt-serif")).toEqual({
      rel: "preload",
      href: "https://test-fonts.example.com/pt-serif/pt-serif-latin-400-normal.woff2",
      as: "font",
      type: "font/woff2",
      crossorigin: true,
    });
  });

  test("respects custom weight and style for a static font", () => {
    expect(getFontPreload("pt-serif", 700, "italic").href).toBe(
      "https://test-fonts.example.com/pt-serif/pt-serif-latin-700-italic.woff2",
    );
  });

  test("throws on unknown font id", () => {
    expect(() => getFontPreload("not-a-font" as FontId)).toThrow("Unknown font: not-a-font");
  });

  test("throws when no file matches the requested variant", () => {
    expect(() => getFontPreload("pt-serif", 500, "normal")).toThrow(
      "No file for pt-serif (weight 500, style normal)",
    );
  });
});

describe("loadFonts", () => {
  beforeEach(() => {
    clearLoadedFonts();
    vi.mocked(document.fonts.add).mockClear();
  });

  test("registers a FontFace per file with the correct descriptors", async () => {
    await loadFonts("inter");
    const faces = getAddedFaces();
    expect(faces.length).toBeGreaterThan(0);
    expect(faces[0]!.family).toBe("Inter");
    expect(faces[0]!.source).toContain(`format("woff2")`);
    expect(faces[0]!.descriptors).toMatchObject({ display: "swap" });
  });

  test("loads multiple fonts in a single call", async () => {
    await loadFonts("inter", "lora");
    const families = getAddedFaces().map((face) => face.family);
    expect(families).toContain("Inter");
    expect(families).toContain("Lora");
  });

  test("skips fonts already loaded in a previous call", async () => {
    await loadFonts("inter");
    vi.mocked(document.fonts.add).mockClear();
    await loadFonts("inter");
    expect(document.fonts.add).not.toHaveBeenCalled();
  });

  test("throws on unknown font id", async () => {
    await expect(loadFonts("not-a-font" as FontId)).rejects.toThrow("Unknown font: not-a-font");
  });
});

describe("loadFontPreviews", () => {
  beforeEach(() => {
    clearLoadedPreviews();
    vi.mocked(document.fonts.add).mockClear();
  });

  test("registers a FontFace under the previewFamily for each id", async () => {
    await loadFontPreviews("inter", "lora");
    const families = getAddedFaces().map((face) => face.family);
    expect(families).toEqual(["Inter Preview", "Lora Preview"]);
  });

  test("uses the previewPath from the manifest", async () => {
    await loadFontPreviews("inter");
    const faces = getAddedFaces();
    expect(faces[0]!.source).toContain("inter/inter-preview.woff2");
  });

  test("registers each face with display: swap", async () => {
    await loadFontPreviews("inter");
    const faces = getAddedFaces();
    expect(faces[0]!.descriptors).toMatchObject({ display: "swap" });
  });

  test("skips ids already loaded in a previous call", async () => {
    await loadFontPreviews("inter");
    vi.mocked(document.fonts.add).mockClear();
    await loadFontPreviews("inter");
    expect(document.fonts.add).not.toHaveBeenCalled();
  });

  test("throws on unknown font id", async () => {
    await expect(loadFontPreviews("not-a-font" as FontId)).rejects.toThrow(
      "Unknown font: not-a-font",
    );
  });
});

describe("variable fonts", () => {
  describe("generateFontFaceCSS", () => {
    test("emits font-weight as a min-max range", () => {
      const { content } = generateFontFaceCSS(["inter"]);
      expect(content).toContain("font-weight:100 900");
    });

    test("emits one declaration per style", () => {
      const { content } = generateFontFaceCSS(["inter"]);
      expect(content.match(/@font-face\{/g)?.length).toBe(2);
      expect(content).toContain("font-style:normal");
      expect(content).toContain("font-style:italic");
    });
  });

  describe("getFontPreload", () => {
    test("returns the variable file for any weight in range", () => {
      expect(getFontPreload("inter", 600).href).toContain("inter-latin-wght-normal.woff2");
    });

    test("returns the variable file at the boundary weights", () => {
      expect(getFontPreload("inter", 100).href).toContain("inter-latin-wght-normal.woff2");
      expect(getFontPreload("inter", 900).href).toContain("inter-latin-wght-normal.woff2");
    });

    test("throws when the requested weight is outside the range", () => {
      expect(() => getFontPreload("inter", 1000)).toThrow();
    });
  });

  describe("loadFonts", () => {
    beforeEach(() => {
      clearLoadedFonts();
      vi.mocked(document.fonts.add).mockClear();
    });

    test("registers each FontFace with a min-max weight range", async () => {
      await loadFonts("inter");
      const faces = vi
        .mocked(document.fonts.add)
        .mock.calls.map(([face]) => face as unknown as FontFace);
      expect(faces).toHaveLength(2);
      expect(faces[0]!.descriptors).toMatchObject({ weight: "100 900" });
    });
  });
});
