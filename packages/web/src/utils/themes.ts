import { getFontConfig } from "@/utils/fonts";
import { toCSSColor, type Color } from "@/utils/color";
import type { Theme } from "api/types/themes";
import type { FontId } from "@/config/fonts";

export type { Theme };

export interface StyleOverrides {
  backgroundColor?: Color | null;
  textColor?: Color | null;
  accentColor?: Color | null;
  font?: FontId | null;
}

export interface ResolvedStyles {
  backgroundColor: Color | null;
  textColor: Color | null;
  accentColor: Color | null;
  font: string | null;
}

/**
 * Resolves the effective styles by applying overrides on top of theme defaults.
 * Overrides take precedence over theme values.
 */
export function resolveThemeStyles(
  theme: Theme | null,
  overrides: StyleOverrides,
): ResolvedStyles {
  const backgroundColor = overrides.backgroundColor ?? theme?.colors.background ?? null;
  const textColor = overrides.textColor ?? theme?.colors.text ?? null;
  const accentColor = overrides.accentColor ?? theme?.colors.accent ?? null;
  const fontId = overrides.font ?? theme?.fonts.body ?? null;
  const font = fontId ? getFontConfig(fontId) : null;

  return {
    backgroundColor,
    textColor,
    accentColor,
    font: font ? `"${font.family}", "${font.fallback}"` : null,
  };
}

/**
 * Converts resolved styles to CSS custom property values.
 */
export function toCSSProperties(styles: ResolvedStyles): {
  "--background-color"?: string;
  "--text-color"?: string;
  "--accent-color"?: string;
  "--font"?: string;
} {
  return {
    "--background-color": styles.backgroundColor
      ? toCSSColor(styles.backgroundColor)
      : undefined,
    "--text-color": styles.textColor
      ? toCSSColor(styles.textColor)
      : undefined,
    "--accent-color": styles.accentColor
      ? toCSSColor(styles.accentColor)
      : undefined,
    "--font": styles.font ?? undefined,
  };
}

/**
 * Resolves theme and overrides directly into CSS custom properties.
 */
export function getThemeStyles(
  theme: Theme | null,
  overrides: StyleOverrides,
): ReturnType<typeof toCSSProperties> {
  return toCSSProperties(resolveThemeStyles(theme, overrides));
}
