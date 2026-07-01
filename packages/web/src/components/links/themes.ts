import DefaultLink from "./DefaultLink";
import RoundButtonLink from "./RoundButtonLink";
import SquareButtonLink from "./SquareButtonLink";
import type { Reactive } from "@/utils/reactivity";
import type { ThemeRegistry } from "@/types/themes";
import type { JSX } from "@/jsx/jsx";

export interface LinkThemeProps {
  href: Reactive<string>;
  children?: JSX.Node;
}

export const LINK_THEMES: ThemeRegistry<LinkThemeProps> = {
  default: DefaultLink,
  "round-button": RoundButtonLink,
  "square-button": SquareButtonLink,
} as const;

export const LINK_THEME_OPTIONS = Object.keys(LINK_THEMES) as (keyof typeof LINK_THEMES)[];

export const DEFAULT_LINK_THEME = "default";
