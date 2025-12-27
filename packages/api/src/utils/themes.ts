import type { Font } from "@/generated/prisma/client";
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
