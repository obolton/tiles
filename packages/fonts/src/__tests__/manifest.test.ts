import { describe, expect, test } from "vitest";
import { FontsManifestSchema, FontVariantSchema, ManifestFontSchema } from "../manifest";

const SAMPLE_VARIANT = {
  weight: 400,
  style: "normal",
  subset: "latin",
  path: "inter/inter-latin-400-normal.woff2",
};

const SAMPLE_FONT = {
  family: "Inter",
  version: "v20",
  files: [SAMPLE_VARIANT],
  previewPath: "inter/inter-preview.woff2",
};

const SAMPLE_MANIFEST = {
  fonts: { inter: SAMPLE_FONT },
};

describe("FontVariantSchema", () => {
  test("accepts a valid variant", () => {
    expect(FontVariantSchema.parse(SAMPLE_VARIANT)).toEqual(SAMPLE_VARIANT);
  });

  test("rejects an unknown style", () => {
    const result = FontVariantSchema.safeParse({
      ...SAMPLE_VARIANT,
      style: "oblique",
    });
    expect(result.success).toBe(false);
  });

  test("rejects unknown fields", () => {
    const result = FontVariantSchema.safeParse({
      ...SAMPLE_VARIANT,
      extra: "x",
    });
    expect(result.success).toBe(false);
  });

  test("rejects a missing required field", () => {
    const { weight: _weight, ...withoutWeight } = SAMPLE_VARIANT;
    expect(FontVariantSchema.safeParse(withoutWeight).success).toBe(false);
  });

  test("rejects a non-integer weight", () => {
    const result = FontVariantSchema.safeParse({
      ...SAMPLE_VARIANT,
      weight: 400.5,
    });
    expect(result.success).toBe(false);
  });

  test("accepts a variable weight range", () => {
    const file = { ...SAMPLE_VARIANT, weight: { min: 100, max: 900 } };
    expect(FontVariantSchema.parse(file)).toEqual(file);
  });

  test("rejects a weight range with missing bounds", () => {
    const result = FontVariantSchema.safeParse({
      ...SAMPLE_VARIANT,
      weight: { min: 100 },
    });
    expect(result.success).toBe(false);
  });

  test("rejects a weight range with non-numeric bounds", () => {
    const result = FontVariantSchema.safeParse({
      ...SAMPLE_VARIANT,
      weight: { min: "100", max: "900" },
    });
    expect(result.success).toBe(false);
  });
});

describe("ManifestFontSchema", () => {
  test("accepts a valid font entry", () => {
    expect(ManifestFontSchema.parse(SAMPLE_FONT)).toEqual(SAMPLE_FONT);
  });

  test("rejects unknown fields", () => {
    const result = ManifestFontSchema.safeParse({
      ...SAMPLE_FONT,
      extra: "x",
    });
    expect(result.success).toBe(false);
  });

  test("rejects when an inner file has unknown fields", () => {
    const result = ManifestFontSchema.safeParse({
      ...SAMPLE_FONT,
      files: [{ ...SAMPLE_VARIANT, extra: "x" }],
    });
    expect(result.success).toBe(false);
  });

  test("rejects a missing previewPath", () => {
    const { previewPath: _previewPath, ...withoutPreview } = SAMPLE_FONT;
    expect(ManifestFontSchema.safeParse(withoutPreview).success).toBe(false);
  });
});

describe("FontsManifestSchema", () => {
  test("accepts a valid manifest", () => {
    expect(FontsManifestSchema.parse(SAMPLE_MANIFEST)).toEqual(SAMPLE_MANIFEST);
  });

  test("rejects unknown top-level fields", () => {
    const result = FontsManifestSchema.safeParse({
      ...SAMPLE_MANIFEST,
      extra: "x",
    });
    expect(result.success).toBe(false);
  });

  test("rejects when an inner font has unknown fields", () => {
    const result = FontsManifestSchema.safeParse({
      ...SAMPLE_MANIFEST,
      fonts: { inter: { ...SAMPLE_FONT, extra: "x" } },
    });
    expect(result.success).toBe(false);
  });
});
