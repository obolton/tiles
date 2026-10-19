import DefaultDateTime from "./DefaultDateTime";
import ShortDateTime from "./ShortDateTime";
import LongDateTime from "./LongDateTime";
import ColorfulDateTime from "./ColorfulDateTime";
import ColorfulStackedDateTime from "./ColorfulStackedDateTime";
import type { Reactive } from "reactivity";
import type { ThemeRegistry } from "@/types/themes";

export interface DateTimeThemeProps {
  value: Reactive<Date>;
  time: Reactive<boolean>;
}

export const DATE_THEMES: ThemeRegistry<DateTimeThemeProps> = {
  default: DefaultDateTime,
  short: ShortDateTime,
  long: LongDateTime,
  colorful: ColorfulDateTime,
  "colorful-stacked": ColorfulStackedDateTime,
} as const;

export const DATE_THEME_OPTIONS = Object.keys(DATE_THEMES);

export const DEFAULT_DATE_THEME = "default";
