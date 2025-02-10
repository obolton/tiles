import { describe, test, expect } from "vitest";
import { FONTS, DEFAULT_WEIGHTS, type FontId } from "@/config/fonts";
import {
  GOOGLE_FONTS_BASE_URL,
  getFontConfig,
  getGoogleFontsUrl,
} from "../fonts";

const MOCK_FONTS = [
  {
    id: "MODERN",
    name: "Modern",
    family: "Inter",
    opticalSizing: true,
    weights: "14..32,400..700",
    fallback: "sans-serif",
  },
  {
    id: "CLASSIC",
    name: "Classic",
    family: "Lora",
    fallback: "serif",
  },
];

describe("getFontConfig", () => {
  test("should return the correct font config for a given ID", () => {
    const id = "CLASSIC";
    const expectedConfig = FONTS.find((font) => font.id === id);
    expect(getFontConfig(id)).toEqual(expectedConfig);
  });

  test("should throw if the font family is not found", () => {
    expect(() => getFontConfig("UNKNOWN" as FontId)).toThrowError(
      "Invalid font: UNKNOWN",
    );
  });
});

describe("getGoogleFontsUrl", () => {
  test("should return the correct Google Fonts URL for a set of font families", () => {
    const expectedUrl = `${GOOGLE_FONTS_BASE_URL}?family=Inter:ital,opsz,wght@0,14..32,${DEFAULT_WEIGHTS};1,14..32,${DEFAULT_WEIGHTS}&family=Lora:ital,wght@0,${DEFAULT_WEIGHTS};1,${DEFAULT_WEIGHTS}&display=swap`;
    expect(getGoogleFontsUrl(MOCK_FONTS)).toBe(expectedUrl);
  });
});
