import { describe, test, expect } from "vitest";
import { FONTS, DEFAULT_WEIGHTS, type FontFamily } from "@/config/fonts";
import {
  GOOGLE_FONTS_BASE_URL,
  getFontConfig,
  getGoogleFontUrl,
  getGoogleFontUrlAllFonts,
} from "../fonts";

describe("getFontConfig", () => {
  test("should return the correct font config for a given family", () => {
    const family = "Lora";
    const expectedConfig = FONTS.find((font) => font.family === family);
    expect(getFontConfig(family)).toEqual(expectedConfig);
  });

  test("should return null if the font family is not found", () => {
    const family = "NonExistentFont";
    expect(getFontConfig(family as FontFamily)).toBeUndefined();
  });
});

describe("getGoogleFontUrl", () => {
  test("should return the correct Google Fonts URL for a set of font families", () => {
    const fonts = new Set(["Inter", "Lora"] as const);
    const expectedUrl = `${GOOGLE_FONTS_BASE_URL}?family=Inter:ital,opsz,wght@0,14..32,${DEFAULT_WEIGHTS};1,14..32,${DEFAULT_WEIGHTS}&family=Lora:ital,wght@0,${DEFAULT_WEIGHTS};1,${DEFAULT_WEIGHTS}&display=swap`;
    expect(getGoogleFontUrl(fonts)).toBe(expectedUrl);
  });

  test("should throw if no font families are provided", () => {
    const fonts: Set<FontFamily> = new Set();
    expect(() => getGoogleFontUrl(fonts)).toThrowError(
      "No font families provided",
    );
  });
});

describe("getGoogleFontUrlAllFonts", () => {
  test("should return the correct Google Fonts URL for all fonts", () => {
    expect(getGoogleFontUrlAllFonts()).toMatch(GOOGLE_FONTS_BASE_URL);
  });
});
