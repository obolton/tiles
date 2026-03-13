import type { ChartType, Property } from "@/models/Chart";
import type { ColorFill, GradientFill } from "@/components/fills/types";
import type { Action } from "./base";
import type { TileActionData } from "./tile";

// Series snapshot for add/restore
export interface ChartSeriesSnapshot {
  id: string;
  type: ChartType;
  column: Property;
  fill: ColorFill | GradientFill | null;
}

// Set chart properties
export interface SetChartPropertiesData extends TileActionData {
  changes: {
    label?: Property | null;
  };
}

export interface SetChartPropertiesAction extends Action<
  "chart.setProperties",
  SetChartPropertiesData
> {}

// Add series
export interface AddSeriesData extends TileActionData {
  series: ChartSeriesSnapshot;
}

export interface AddSeriesAction extends Action<
  "chart.addSeries",
  AddSeriesData
> {}

// Remove series by ID
export interface RemoveSeriesData extends TileActionData {
  seriesId: string;
}

export interface RemoveSeriesAction extends Action<
  "chart.removeSeries",
  RemoveSeriesData
> {}

// Restore series from snapshot (reverse of remove)
export interface RestoreSeriesData extends TileActionData {
  series: ChartSeriesSnapshot;
}

export interface RestoreSeriesAction extends Action<
  "chart.restoreSeries",
  RestoreSeriesData
> {}

// Set series properties
export interface SetSeriesPropertiesData extends TileActionData {
  seriesId: string;
  changes: Partial<Pick<ChartSeriesSnapshot, "type" | "fill">>;
}

export interface SetSeriesPropertiesAction extends Action<
  "chart.setSeriesProperties",
  SetSeriesPropertiesData
> {}

export type ChartAction =
  | SetChartPropertiesAction
  | AddSeriesAction
  | RemoveSeriesAction
  | RestoreSeriesAction
  | SetSeriesPropertiesAction;
