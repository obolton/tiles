import type { Font, GradientDirection } from "@/generated/prisma/client";
import type { BackgroundSchema } from "@/schema/Background";
import type { ColorSchema } from "@/schema/Color";
import { fromHex } from "./arrays";

interface ThemeDefinition {
  name: string;
  backgroundColor: string;
  textColor: string;
  accentColor: string;
  headingFont: Font;
  bodyFont: Font;
  codeFont: Font;
}

const DEFAULT_THEMES: ThemeDefinition[] = [
  {
    name: "Light",
    backgroundColor: "ffffffffffff", // White
    textColor: "1a1a1a1a1a1a", // Near black
    accentColor: "0066ff0066ff", // Blue
    headingFont: "MODERN",
    bodyFont: "MODERN",
    codeFont: "CODE",
  },
  {
    name: "Dark",
    backgroundColor: "1a1a1a1a1a1a", // Near black
    textColor: "ffffffffffff", // White
    accentColor: "66b3ff66b3ff", // Light blue
    headingFont: "MODERN",
    bodyFont: "MODERN",
    codeFont: "CODE",
  },
];

export function getDefaultThemesData() {
  return DEFAULT_THEMES.map(
    ({ backgroundColor, textColor, accentColor, ...theme }) => ({
      ...theme,
      backgroundColor: fromHex(backgroundColor),
      textColor: fromHex(textColor),
      accentColor: fromHex(accentColor),
    }),
  );
}

export interface TextColor {
  textColor: Uint8Array<ArrayBuffer> | null | undefined;
}

export function getTextColorProperties(
  textColor?: ColorSchema | null,
): TextColor {
  if (textColor === undefined) {
    return { textColor: undefined };
  }
  if (textColor === null) {
    return { textColor: null };
  }
  return { textColor: fromHex(textColor) };
}

type ColorBackgroundSchema = Exclude<BackgroundSchema, { type: "image" }>;

export interface ColorBackground {
  backgroundColor: Uint8Array<ArrayBuffer>;
  backgroundGradient: GradientDirection | null;
}

export interface Background {
  backgroundColor: Uint8Array<ArrayBuffer> | null;
  backgroundGradient: GradientDirection | null;
  backgroundImageId: string | null;
}

export function getBackgroundProperties(
  background: ColorBackgroundSchema,
): ColorBackground;
export function getBackgroundProperties(
  background: ColorBackgroundSchema | undefined,
): ColorBackground | undefined;
export function getBackgroundProperties(
  background?: BackgroundSchema | null,
): Background | undefined;
export function getBackgroundProperties(
  background?: BackgroundSchema | null,
): ColorBackground | Background | undefined {
  if (background === undefined) {
    return undefined;
  }

  if (background === null) {
    return {
      backgroundColor: null,
      backgroundGradient: null,
      backgroundImageId: null,
    };
  }

  if (background.type === "image") {
    return {
      backgroundColor: null,
      backgroundGradient: null,
      backgroundImageId: background.imageId,
    };
  }

  if (background.type === "gradient") {
    return {
      backgroundColor: fromHex(background.colorA + background.colorB),
      backgroundGradient: background.direction,
    };
  }

  return {
    backgroundColor: fromHex(background.color),
    backgroundGradient: null,
  };
}
