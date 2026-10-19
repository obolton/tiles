import DefaultHeading from "./DefaultHeading";
import UnderlinedHeading from "./UnderlinedHeading";
import InvertedHeading from "./InvertedHeading";
import type { ThemeRegistry } from "@/types/themes";
import type { JSX } from "jsx/jsx";

export interface HeadingThemeProps {
  level: 1 | 2 | 3;
  align?: "left" | "center" | "right" | "justify";
  lineHeight?: number;
  indent?: number;
  children?: JSX.Node;
}

export const HEADING_THEMES: ThemeRegistry<HeadingThemeProps> = {
  default: DefaultHeading,
  underlined: UnderlinedHeading,
  inverted: InvertedHeading,
} as const;

export const HEADING_THEME_OPTIONS = Object.keys(HEADING_THEMES);

export const DEFAULT_HEADING_THEME = "default";
