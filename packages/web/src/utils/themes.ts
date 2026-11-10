import * as Y from "yjs";
import { parseParentId } from "@/models/parentId";
import { getBackgroundColor, getBackgroundImage } from "@/utils/backgrounds";
import { toCSSColor, type Color } from "@/utils/color";
import { loadFonts } from "@/utils/fonts";
import { getFontConfig, DEFAULT_FONT, DEFAULT_HEADING_FONT, DEFAULT_CODE_FONT } from "fonts/config";
import type { FontId } from "fonts/config";
import type { ThemeColor } from "@/components/colors/ColorPalette";
import type { Fill } from "@/components/fills/types";
import type Tile from "@/models/Tile";
import type { ThemeData, ThemeValues } from "@/models/Theme";

export type { ThemeData };

/** The values a new theme starts from. */
export const DEFAULT_THEME_VALUES: Omit<ThemeValues, "name"> = {
  background: { type: "color", color: "ffffffffffff" },
  colors: { text: "1a1a1a1a1a1a", accent: "00006666ffff" },
  fonts: { heading: DEFAULT_HEADING_FONT, body: DEFAULT_FONT, code: DEFAULT_CODE_FONT },
};

export interface StyleOverrides {
  background?: Fill | null;
  textColor?: Color | null;
  borderColor?: Color | null;
}

export type ThemeStyles = {
  "--background-color": string | undefined;
  "--background-image": string | undefined;
  "--text-color": string | undefined;
  "--accent-color": string | undefined;
  "--font": string | undefined;
  "--heading-font": string | undefined;
  "--code-font": string | undefined;
  "--border-color": string | undefined;
};

function formatFont(id: FontId) {
  const config = getFontConfig(id);
  return `"${config.family}", ${config.fallback}`;
}

function getFillColor(fill: Fill | null | undefined) {
  return fill ? getBackgroundColor(fill) : null;
}

/**
 * Resolves a theme and any overrides into CSS custom properties. Every property is present, so
 * applying the result also clears a stale value when an override is removed.
 */
export function getThemeStyles(
  theme: ThemeData | null,
  overrides: StyleOverrides = {},
): ThemeStyles {
  const background = overrides.background ?? theme?.background ?? null;
  const backgroundColor = getFillColor(background) ?? getFillColor(theme?.background);
  const textColor = overrides.textColor ?? theme?.colors.text ?? null;

  return {
    "--background-color": backgroundColor ? toCSSColor(backgroundColor) : undefined,
    "--background-image": background ? getBackgroundImage(background) : undefined,
    "--text-color": textColor ? toCSSColor(textColor) : undefined,
    "--accent-color": theme ? toCSSColor(theme.colors.accent) : undefined,
    "--font": theme ? formatFont(theme.fonts.body) : undefined,
    "--heading-font": theme ? formatFont(theme.fonts.heading) : undefined,
    "--code-font": theme ? formatFont(theme.fonts.code) : undefined,
    "--border-color": overrides.borderColor ? toCSSColor(overrides.borderColor) : undefined,
  };
}

/** Applies theme styles to an element, removing the properties that are unset. */
export function applyThemeStyles(element: HTMLElement, styles: ThemeStyles) {
  for (const [property, value] of Object.entries(styles)) {
    if (value === undefined) {
      element.style.removeProperty(property);
    } else {
      element.style.setProperty(property, value);
    }
  }
}

/** The theme's colours, for use in colour palettes. */
export function getThemeColors(theme: ThemeData): ThemeColor[] {
  const colors: ThemeColor[] = [
    { name: "Text", color: theme.colors.text },
    { name: "Accent", color: theme.colors.accent },
  ];
  if (theme.background.type === "color") {
    colors.push({ name: "Background", color: theme.background.color });
  }
  return colors;
}

/** The theme in effect for a tile: its own, then its section's, then the page's. */
export function resolveTheme(tile: Tile): ThemeData | null {
  if (tile.theme.value) {
    return tile.theme.value;
  }

  const parent = parseParentId(tile.parentId.value);
  if (parent.type === "section") {
    const section = tile.page.getSection(parent.sectionId);
    if (section.theme.value) {
      return section.theme.value;
    }
  }

  return tile.page.theme.value;
}

export function loadThemeFonts(theme: ThemeData) {
  const { heading, body, code } = theme.fonts;
  return loadFonts(heading, body, code);
}

export function getPageTheme(doc: Y.Doc): ThemeData | null {
  const themeId = doc.getMap("metadata").get("themeId") as string | null;
  return themeId ? (doc.getMap<ThemeData>("themes").get(themeId) ?? null) : null;
}
