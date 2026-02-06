import type { ChartType, Property } from "@/models/Chart";
import type { ColorFill, GradientFill } from "@/components/fills/types";
import type { Action } from "./base";

// Series snapshot for add/restore
export interface ChartSeriesSnapshot {
  id: string;
  type: ChartType;
  column: Property;
  fill: ColorFill | GradientFill | null;
}

// Set chart properties
export interface SetChartPropertiesData {
  chartId: string;
  changes: {
    label?: Property | null;
  };
}

export interface SetChartPropertiesAction extends Action<
  "chart.setProperties",
  SetChartPropertiesData
> {}

// Add series
export interface AddSeriesData {
  chartId: string;
  series: ChartSeriesSnapshot;
}

export interface AddSeriesAction extends Action<
  "chart.addSeries",
  AddSeriesData
> {}

// Remove series by ID
export interface RemoveSeriesData {
  chartId: string;
  seriesId: string;
}

export interface RemoveSeriesAction extends Action<
  "chart.removeSeries",
  RemoveSeriesData
> {}

// Restore series from snapshot (reverse of remove)
export interface RestoreSeriesData {
  chartId: string;
  series: ChartSeriesSnapshot;
}

export interface RestoreSeriesAction extends Action<
  "chart.restoreSeries",
  RestoreSeriesData
> {}

// Set series properties
export interface SetSeriesPropertiesData {
  chartId: string;
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
