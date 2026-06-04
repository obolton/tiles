export type TileType =
  | "SECTION"
  | "TEXT"
  | "IMAGE"
  | "VIDEO"
  | "LINK"
  | "PAGE_LINK"
  | "TABLE"
  | "CHART";

export type Sizing =
  | "AUTO"
  | "LANDSCAPE"
  | "PORTRAIT"
  | "CUSTOM"
  | "SQUARE"
  | "FOUR_THREE"
  | "THREE_FOUR";

export type Animation = "FADE" | "SLIDE" | "GROW" | "SHRINK";

export type FrameStyle =
  | "NONE"
  | "OUTLINED"
  | "SUBTLE"
  | "CARD"
  | "RAISED"
  | "FRAMED"
  | "FULL_BLEED";

export type Layout =
  | "GRID"
  | "HORIZONTAL"
  | "VERTICAL"
  | "FREEFORM"
  | "CALENDAR"
  | "MAP";

export type MapStyle = "DEFAULT" | "SATELLITE" | "WATERCOLOR" | "MONOCHROME";

export type DockEdge = "TOP" | "LEFT" | "RIGHT" | "BOTTOM";

export type VideoType = "YOUTUBE";

export type ChartSeriesType = "BAR" | "LINE" | "AREA";

export type VerticalAlignment = "TOP" | "CENTER" | "BOTTOM";
