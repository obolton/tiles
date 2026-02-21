import { getFontConfig } from "@/utils/fonts";
import { getBackgroundStyle } from "@/utils/backgrounds";
import { toCSSColor, type Color } from "@/utils/color";
import type { Theme } from "api/types/themes";
import type { FontConfig, FontId } from "@/config/fonts";
import type { Fill } from "@/components/fills/types";

export type { Theme };

function formatFont(config: FontConfig) {
  return `"${config.family}", "${config.fallback}"`;
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
  borderRadius: number | null;
}

/**
 * Resolves the effective styles by applying overrides on top of theme defaults.
 * Overrides take precedence over theme values.
 */
export function resolveThemeStyles(
  theme: Theme | null,
  overrides: StyleOverrides = {},
): ResolvedStyles {
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

  const borderColor = theme?.border.color ?? textColor;
  const borderRadius = theme?.border.radius ?? null;

  return {
    background,
    textColor,
    accentColor,
    font: font ? formatFont(font) : null,
    headingFont: headingFontConfig ? formatFont(headingFontConfig) : null,
    codeFont: codeFontConfig ? formatFont(codeFontConfig) : null,
    borderColor,
    borderRadius,
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
  "--border-radius"?: string;
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
    "--border-radius": styles.borderRadius
      ? `${styles.borderRadius}px`
      : undefined,
  };
}

/**
 * Resolves theme and overrides directly into CSS custom properties.
 */
export function getThemeStyles(
  theme: Theme | null,
  overrides: StyleOverrides = {},
): ReturnType<typeof toCSSProperties> {
  return toCSSProperties(resolveThemeStyles(theme, overrides));
}
