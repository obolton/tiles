import { describe, expect, test } from "vitest";
import {
  FONTS,
  FONT_IDS,
  FontConfigSchema,
  FontsSchema,
  FontIdSchema,
  DEFAULT_FONT,
  DEFAULT_HEADING_FONT,
  DEFAULT_CODE_FONT,
  getFontConfig,
  type FontId,
} from "../fonts";

describe("FontsSchema", () => {
  test("accepts the registry as parsed", () => {
    expect(() => FontsSchema.parse(FONTS)).not.toThrow();
  });

  test("rejects an empty array", () => {
    expect(FontsSchema.safeParse([]).success).toBe(false);
  });

  test("rejects duplicate ids", () => {
    const entry = FontConfigSchema.parse(FONTS[0]);
    const result = FontsSchema.safeParse([entry, entry]);
    expect(result.success).toBe(false);
  });

  test("rejects non-kebab-case ids", () => {
    const result = FontConfigSchema.safeParse({
      ...FONTS[0],
      id: "Not_Kebab",
    });
    expect(result.success).toBe(false);
  });

  test("rejects an unknown category", () => {
    const result = FontConfigSchema.safeParse({
      ...FONTS[0],
      category: "handwriting",
    });
    expect(result.success).toBe(false);
  });
});

describe("registry contents", () => {
  test("default font ids are present in the registry", () => {
    expect(FONT_IDS).toContain(DEFAULT_FONT);
    expect(FONT_IDS).toContain(DEFAULT_HEADING_FONT);
    expect(FONT_IDS).toContain(DEFAULT_CODE_FONT);
  });

  test("FontIdSchema accepts every registered id", () => {
    for (const id of FONT_IDS) {
      expect(FontIdSchema.safeParse(id).success).toBe(true);
    }
  });

  test("FontIdSchema rejects unknown ids", () => {
    expect(FontIdSchema.safeParse("not-a-font").success).toBe(false);
  });
});

describe("getFontConfig", () => {
  test("returns the matching config for a known id", () => {
    const id = FONT_IDS[0]!;
    const config = getFontConfig(id);
    expect(config.id).toBe(id);
  });

  test("throws for an unknown id", () => {
    expect(() => getFontConfig("not-a-font" as FontId)).toThrow("Invalid font: not-a-font");
  });
});
