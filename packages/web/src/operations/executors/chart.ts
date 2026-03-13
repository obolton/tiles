import { reactive } from "@/utils/reactivity";
import Chart from "@/models/Chart";
import type {
  SetChartPropertiesAction,
  AddSeriesAction,
  RemoveSeriesAction,
  RestoreSeriesAction,
  SetSeriesPropertiesAction,
} from "../types";
import type { ActionExecutor } from "./types";

const setProperties: ActionExecutor<SetChartPropertiesAction> = async (
  editor,
  { tileId, changes },
) => {
  const chart = editor.page.getTile(tileId, Chart);
  if (changes.label !== undefined) {
    chart.label.value = changes.label;
  }
};

const addSeries: ActionExecutor<AddSeriesAction> = async (
  editor,
  { tileId, series },
) => {
  const chart = editor.page.getTile(tileId, Chart);
  const { id, type, column, fill } = series;

  chart.series.push({
    id,
    type: reactive(type),
    column: reactive(column),
    fill: reactive(fill),
  });
};

const removeSeries: ActionExecutor<RemoveSeriesAction> = async (
  editor,
  { tileId, seriesId },
) => {
  const chart = editor.page.getTile(tileId, Chart);
  chart.series.value = chart.series.value.filter((s) => s.id !== seriesId);
};

const restoreSeries: ActionExecutor<RestoreSeriesAction> = async (
  editor,
  { tileId, series },
) => {
  const chart = editor.page.getTile(tileId, Chart);
  const { id, type, column, fill } = series;

  chart.series.push({
    id,
    type: reactive(type),
    column: reactive(column),
    fill: reactive(fill),
  });
};

const setSeriesProperties: ActionExecutor<SetSeriesPropertiesAction> = async (
  editor,
  { tileId, seriesId, changes },
) => {
  const chart = editor.page.getTile(tileId, Chart);
  const series = chart.series.find((s) => s.id === seriesId);
  if (!series) {
    return;
  }

  if (changes.type !== undefined) {
    series.type.value = changes.type;
  }
  if (changes.fill !== undefined) {
    series.fill.value = changes.fill;
  }
};

export const executors = {
  "chart.setProperties": setProperties,
  "chart.addSeries": addSeries,
  "chart.removeSeries": removeSeries,
  "chart.restoreSeries": restoreSeries,
  "chart.setSeriesProperties": setSeriesProperties,
} as const;
