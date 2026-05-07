import { describe, expect, test } from "vitest";
import {
  FontsManifestSchema,
  ManifestFileSchema,
  ManifestFontSchema,
} from "../manifest";

const SAMPLE_FILE = {
  weight: 400,
  style: "normal",
  subset: "latin",
  path: "inter/inter-latin-400-normal.woff2",
};

const SAMPLE_FONT = {
  family: "Inter",
  version: "v20",
  files: [SAMPLE_FILE],
};

const SAMPLE_MANIFEST = {
  syncedAt: "2026-05-04T12:00:00.000Z",
  fonts: { inter: SAMPLE_FONT },
};

describe("ManifestFileSchema", () => {
  test("accepts a valid file entry", () => {
    expect(ManifestFileSchema.parse(SAMPLE_FILE)).toEqual(SAMPLE_FILE);
  });

  test("rejects unknown fields", () => {
    const result = ManifestFileSchema.safeParse({
      ...SAMPLE_FILE,
      extra: "x",
    });
    expect(result.success).toBe(false);
  });

  test("rejects a missing required field", () => {
    const { weight: _weight, ...withoutWeight } = SAMPLE_FILE;
    expect(ManifestFileSchema.safeParse(withoutWeight).success).toBe(false);
  });

  test("rejects a non-integer weight", () => {
    const result = ManifestFileSchema.safeParse({
      ...SAMPLE_FILE,
      weight: 400.5,
    });
    expect(result.success).toBe(false);
  });

  test("accepts a variable weight range", () => {
    const file = { ...SAMPLE_FILE, weight: { min: 100, max: 900 } };
    expect(ManifestFileSchema.parse(file)).toEqual(file);
  });

  test("rejects a weight range with missing bounds", () => {
    const result = ManifestFileSchema.safeParse({
      ...SAMPLE_FILE,
      weight: { min: 100 },
    });
    expect(result.success).toBe(false);
  });

  test("rejects a weight range with non-numeric bounds", () => {
    const result = ManifestFileSchema.safeParse({
      ...SAMPLE_FILE,
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
      files: [{ ...SAMPLE_FILE, extra: "x" }],
    });
    expect(result.success).toBe(false);
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
