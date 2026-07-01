import type { ColorFill, GradientFill } from "../fill";
import type { Property } from "../chart";
import type { TileBase } from "./base";

export const ChartSeriesType = {
  BAR: "BAR",
  LINE: "LINE",
  AREA: "AREA",
} as const;
export type ChartSeriesType = (typeof ChartSeriesType)[keyof typeof ChartSeriesType];

export interface ChartSeries {
  id: string;
  type: ChartSeriesType;
  column: Property;
  fill: ColorFill | GradientFill | null;
}

export interface ChartTile extends TileBase {
  type: "CHART";
  tableId: string;
  label: Property | null;
  series: ChartSeries[];
}
