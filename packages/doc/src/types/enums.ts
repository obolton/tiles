export const TileType = {
  SECTION: "SECTION",
  TEXT: "TEXT",
  IMAGE: "IMAGE",
  VIDEO: "VIDEO",
  LINK: "LINK",
  PAGE_LINK: "PAGE_LINK",
  TABLE: "TABLE",
  CHART: "CHART",
} as const;
export type TileType = (typeof TileType)[keyof typeof TileType];

export const Sizing = {
  AUTO: "AUTO",
  LANDSCAPE: "LANDSCAPE",
  PORTRAIT: "PORTRAIT",
  CUSTOM: "CUSTOM",
  SQUARE: "SQUARE",
  FOUR_THREE: "FOUR_THREE",
  THREE_FOUR: "THREE_FOUR",
} as const;
export type Sizing = (typeof Sizing)[keyof typeof Sizing];

export const Animation = {
  FADE: "FADE",
  SLIDE: "SLIDE",
  GROW: "GROW",
  SHRINK: "SHRINK",
} as const;
export type Animation = (typeof Animation)[keyof typeof Animation];

export const FrameStyle = {
  NONE: "NONE",
  OUTLINED: "OUTLINED",
  SUBTLE: "SUBTLE",
  CARD: "CARD",
  RAISED: "RAISED",
  FRAMED: "FRAMED",
  FULL_BLEED: "FULL_BLEED",
} as const;
export type FrameStyle = (typeof FrameStyle)[keyof typeof FrameStyle];

export const DockEdge = {
  TOP: "TOP",
  LEFT: "LEFT",
  RIGHT: "RIGHT",
  BOTTOM: "BOTTOM",
} as const;
export type DockEdge = (typeof DockEdge)[keyof typeof DockEdge];
