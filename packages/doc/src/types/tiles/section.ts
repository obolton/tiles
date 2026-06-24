import type { TileBase } from "./base";

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

export interface SectionTile extends TileBase {
  type: "SECTION";
  layout: Layout;
  columns: number | null;
  mapStyle: MapStyle | null;
}
