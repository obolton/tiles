import type { GradientDirection } from "@/generated/prisma/client";
import type { BackgroundSchema } from "@/schema/Background";
import type { FontId } from "fonts/config";
import { fromHex } from "./arrays";

interface ThemeDefinition {
  name: string;
  backgroundColor: string;
  backgroundGradient?: GradientDirection;
  textColor: string;
  accentColor: string;
  headingFont: FontId;
  bodyFont: FontId;
  codeFont: FontId;
}

const DEFAULT_THEMES: ThemeDefinition[] = [
  {
    name: "Light",
    backgroundColor: "ffffffffffff",
    textColor: "1a1a1a1a1a1a",
    accentColor: "00006666ffff",
    headingFont: "inter",
    bodyFont: "inter",
    codeFont: "jetbrains-mono",
  },
  {
    name: "Dark",
    backgroundColor: "1a1a1a1a1a1a",
    textColor: "ffffffffffff",
    accentColor: "6666b3b3ffff",
    headingFont: "inter",
    bodyFont: "inter",
    codeFont: "jetbrains-mono",
  },
  {
    name: "Ocean",
    backgroundColor: "080810103030181860609090",
    backgroundGradient: "VERTICAL",
    textColor: "e0e0e8e8f0f0",
    accentColor: "4040a0a0d8d8",
    headingFont: "inter",
    bodyFont: "inter",
    codeFont: "jetbrains-mono",
  },
  {
    name: "Forest",
    backgroundColor: "1a1a28281a1a",
    textColor: "d8d8e8e8d8d8",
    accentColor: "5a5a7a7a5a5a",
    headingFont: "lora",
    bodyFont: "inter",
    codeFont: "jetbrains-mono",
  },
  {
    name: "Sunset",
    backgroundColor: "fefee8e8d4d4e8e8a0a06060",
    backgroundGradient: "BOTTOM_RIGHT",
    textColor: "2d2d18181010",
    accentColor: "d8d868684848",
    headingFont: "quicksand",
    bodyFont: "inter",
    codeFont: "jetbrains-mono",
  },
  {
    name: "Rose",
    backgroundColor: "fefee0e0e4e4",
    textColor: "2a2a1a1a2020",
    accentColor: "c8c830306060",
    headingFont: "lora",
    bodyFont: "inter",
    codeFont: "jetbrains-mono",
  },
  {
    name: "Violet",
    backgroundColor: "1818080820203a3a18185858",
    backgroundGradient: "BOTTOM_LEFT",
    textColor: "e0e0d8d8f0f0",
    accentColor: "a0a07070d0d0",
    headingFont: "inter",
    bodyFont: "inter",
    codeFont: "jetbrains-mono",
  },
  {
    name: "Slate",
    backgroundColor: "2d2d36364040",
    textColor: "d0d0d8d8e0e0",
    accentColor: "5858a0a0b8b8",
    headingFont: "inter",
    bodyFont: "inter",
    codeFont: "jetbrains-mono",
  },
  {
    name: "Cream",
    backgroundColor: "f8f8f0f0e0e0",
    textColor: "383828281818",
    accentColor: "b0b080804848",
    headingFont: "lora",
    bodyFont: "lora",
    codeFont: "jetbrains-mono",
  },
  {
    name: "Mono",
    backgroundColor: "f0f0f0f0f0f0",
    textColor: "181818181818",
    accentColor: "606060606060",
    headingFont: "inter",
    bodyFont: "inter",
    codeFont: "jetbrains-mono",
  },
];

export function getDefaultThemesData() {
  return DEFAULT_THEMES.map(
    ({ backgroundColor, backgroundGradient, textColor, accentColor, ...theme }) => ({
      ...theme,
      backgroundColor: fromHex(backgroundColor),
      backgroundGradient: backgroundGradient ?? null,
      textColor: fromHex(textColor),
      accentColor: fromHex(accentColor),
    }),
  );
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

export function getBackgroundProperties(background: ColorBackgroundSchema): ColorBackground;
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
