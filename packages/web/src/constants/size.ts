import type { Sizing } from "api/types/tiles";

export const SIZE_UNIT = 24;

export const ASPECT_RATIOS: Record<
  Exclude<Sizing, "CUSTOM" | "AUTO">,
  number
> = {
  LANDSCAPE: 16 / 9,
  PORTRAIT: 9 / 16,
  SQUARE: 1,
  FOUR_THREE: 4 / 3,
  THREE_FOUR: 3 / 4,
};

export const DEFAULT_DOCK_SIZE = 200; // px
