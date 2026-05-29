import ThemeModel from "@/models/Theme";
import { parseParentId } from "@/models/parentId";
import { getBackgroundStyle } from "@/utils/backgrounds";
import { toCSSColor, type Color } from "@/utils/color";
import { getFontConfig, type FontConfig, type FontId } from "api/config/fonts";
import { themesCache } from "@/utils/cache";
import { loadFonts } from "@/utils/fonts";
import type { Theme } from "api/types/themes";
import type { ThemeColor } from "@/components/colors/ColorPalette";
import type { Fill } from "@/components/fills/types";
import type Tile from "@/models/Tile";

export type { Theme };

export type ThemeStyleInput =
  | Pick<Theme, "background" | "colors" | "fonts" | "border">
  | ThemeModel;

function formatFont(config: FontConfig) {
  return `"${config.family}", ${config.fallback}`;
}

export interface StyleOverrides {
  background?: Fill | null;
  textColor?: Color | null;
  accentColor?: Color | null;
  font?: FontId | null;
}

export interface ResolvedStyles {
  background: Fill | null;
  textColor: Color | null;
  accentColor: Color | null;
  font: string | null;
  headingFont: string | null;
  codeFont: string | null;
  borderColor: Color | null;
}

/**
 * Resolves the effective styles by applying overrides on top of theme defaults.
 * Overrides take precedence over theme values.
 */
export function resolveThemeStyles(
  input: ThemeStyleInput | null,
  overrides: StyleOverrides = {},
): ResolvedStyles {
  const theme = input instanceof ThemeModel ? input.serialize() : input;

  const themeBackground = theme?.background ?? null;
  const background = overrides.background ?? themeBackground;
  const textColor = overrides.textColor ?? theme?.colors.text ?? null;
  const accentColor = overrides.accentColor ?? theme?.colors.accent ?? null;
  const fontId = overrides.font ?? theme?.fonts.body ?? null;
  const font = fontId ? getFontConfig(fontId) : null;
  const headingFontId = theme?.fonts.heading ?? null;
  const headingFontConfig = headingFontId ? getFontConfig(headingFontId) : null;
  const codeFontId = theme?.fonts.code ?? null;
  const codeFontConfig = codeFontId ? getFontConfig(codeFontId) : null;

  const borderColor = theme?.border ?? textColor;

  return {
    background,
    textColor,
    accentColor,
    font: font ? formatFont(font) : null,
    headingFont: headingFontConfig ? formatFont(headingFontConfig) : null,
    codeFont: codeFontConfig ? formatFont(codeFontConfig) : null,
    borderColor,
  };
}

/**
 * Converts resolved styles to CSS custom property values.
 */
export function toCSSProperties(styles: ResolvedStyles): {
  "--background"?: string;
  "--text-color"?: string;
  "--accent-color"?: string;
  "--font"?: string;
  "--heading-font"?: string;
  "--code-font"?: string;
  "--border-color"?: string;
} {
  return {
    "--background": getBackgroundStyle(styles.background)?.background,
    "--text-color": styles.textColor ? toCSSColor(styles.textColor) : undefined,
    "--accent-color": styles.accentColor
      ? toCSSColor(styles.accentColor)
      : undefined,
    "--font": styles.font ?? undefined,
    "--heading-font": styles.headingFont ?? undefined,
    "--code-font": styles.codeFont ?? undefined,
    "--border-color": styles.borderColor
      ? toCSSColor(styles.borderColor)
      : undefined,
  };
}

/**
 * Extracts displayable colors from a theme for use in color palettes.
 */
export function getThemeColors(input: ThemeModel | Theme): ThemeColor[] {
  const theme = input instanceof ThemeModel ? input.serialize() : input;

  const colors: ThemeColor[] = [
    { name: "Text", color: theme.colors.text },
    { name: "Accent", color: theme.colors.accent },
  ];
  if (theme.background?.type === "color") {
    colors.push({ name: "Background", color: theme.background.color });
  }
  if (theme.border) {
    colors.push({ name: "Border", color: theme.border });
  }
  return colors;
}

/**
 * Resolves the effective theme for a tile by walking up the cascade:
 * tile > parent section > page.
 */
export function resolveTheme(tile: Tile): ThemeModel | null {
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

/**
 * Resolves theme and overrides directly into CSS custom properties.
 */
export function getThemeStyles(
  theme: ThemeStyleInput | null,
  overrides: StyleOverrides = {},
): ReturnType<typeof toCSSProperties> {
  return toCSSProperties(resolveThemeStyles(theme, overrides));
}

/**
 * Loads the fonts for a theme.
 */
export async function loadThemeFonts(themeId: string) {
  const theme = themesCache.getById(themeId);
  if (theme) {
    const fonts = theme.fonts.value;
    await loadFonts(fonts.heading, fonts.body, fonts.code);
  }
}
