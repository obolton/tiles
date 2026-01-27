import type { ChartType, Property } from "@/models/Chart";
import type { ColorFill, GradientFill } from "@/components/fills/types";
import type { Operation } from "./base";

export interface ChartSeriesSnapshot {
  id: string;
  type: ChartType;
  column: Property;
  fill: ColorFill | GradientFill | null;
}

export interface ChartAddSeriesData {
  chartId: string;
  series: ChartSeriesSnapshot;
}

export interface ChartAddSeriesInverse {
  chartId: string;
  seriesId: string;
}

export interface ChartAddSeriesOperation extends Operation<
  "chart.addSeries",
  ChartAddSeriesData,
  ChartAddSeriesInverse
> {}

export interface ChartDeleteSeriesData {
  chartId: string;
  seriesId: string;
}

export interface ChartDeleteSeriesInverse {
  chartId: string;
  series: ChartSeriesSnapshot;
}

export interface ChartDeleteSeriesOperation extends Operation<
  "chart.deleteSeries",
  ChartDeleteSeriesData,
  ChartDeleteSeriesInverse
> {}

export interface ChartUpdateSeriesData {
  chartId: string;
  seriesId: string;
  changes: Partial<Pick<ChartSeriesSnapshot, "type" | "fill">>;
}

export interface ChartUpdateSeriesOperation extends Operation<
  "chart.updateSeries",
  ChartUpdateSeriesData
> {}

export type ChartOperation =
  | ChartAddSeriesOperation
  | ChartDeleteSeriesOperation
  | ChartUpdateSeriesOperation;
