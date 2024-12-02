import {
  FONTS,
  DEFAULT_WEIGHTS,
  type FontId,
  type FontConfig,
} from "@/config/fonts";

export const GOOGLE_FONTS_BASE_URL = "https://fonts.googleapis.com/css2";

export function getFontConfig(id: FontId) {
  return FONTS.find((font) => font.id === id);
}

function getFontConfigValue(font: FontConfig) {
  const family = font.family.replace(" ", "+");
  const weights = font.weights ?? DEFAULT_WEIGHTS;
  return `${family}:ital${font.opticalSizing ? ",opsz" : ""},wght@0,${weights};1,${weights}`;
}

export function getGoogleFontUrl(fonts: Set<FontId>) {
  if (fonts.size === 0) {
    throw new Error("No font families provided");
  }
  const families = Array.from(fonts)
    .sort()
    .map((family) => getFontConfig(family))
    .filter((config) => typeof config !== "undefined")
    .map((config) => `family=${getFontConfigValue(config)}`);
  return `${GOOGLE_FONTS_BASE_URL}?${families.join("&")}&display=swap`;
}

export function getGoogleFontUrlAllFonts() {
  const families = FONTS.map(
    (config) => `family=${getFontConfigValue(config)}`,
  );
  return `${GOOGLE_FONTS_BASE_URL}?${families.join("&")}&display=swap`;
}
