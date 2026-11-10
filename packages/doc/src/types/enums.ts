export const PageType = {
  DOCUMENT: "DOCUMENT",
  PRESENTATION: "PRESENTATION",
  LAYOUT: "LAYOUT",
} as const;
export type PageType = (typeof PageType)[keyof typeof PageType];

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

export const HorizontalAlignment = {
  LEFT: "LEFT",
  CENTER: "CENTER",
  RIGHT: "RIGHT",
} as const;
export type HorizontalAlignment = (typeof HorizontalAlignment)[keyof typeof HorizontalAlignment];

export const VerticalAlignment = {
  TOP: "TOP",
  CENTER: "CENTER",
  BOTTOM: "BOTTOM",
} as const;
export type VerticalAlignment = (typeof VerticalAlignment)[keyof typeof VerticalAlignment];

export const Layout = {
  GRID: "GRID",
  HORIZONTAL: "HORIZONTAL",
  VERTICAL: "VERTICAL",
  FREEFORM: "FREEFORM",
  CALENDAR: "CALENDAR",
  MAP: "MAP",
} as const;
export type Layout = (typeof Layout)[keyof typeof Layout];

export const MapStyle = {
  DEFAULT: "DEFAULT",
  SATELLITE: "SATELLITE",
  WATERCOLOR: "WATERCOLOR",
  MONOCHROME: "MONOCHROME",
} as const;
export type MapStyle = (typeof MapStyle)[keyof typeof MapStyle];

export const VideoType = {
  YOUTUBE: "YOUTUBE",
  VIMEO: "VIMEO",
} as const;
export type VideoType = (typeof VideoType)[keyof typeof VideoType];

export const ChartSeriesType = {
  BAR: "BAR",
  LINE: "LINE",
  AREA: "AREA",
} as const;
export type ChartSeriesType = (typeof ChartSeriesType)[keyof typeof ChartSeriesType];
