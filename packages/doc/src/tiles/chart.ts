import * as Y from "yjs";
import { buildBaseTileMap, type CreateTileInput } from "./base";
import { buildSeriesMap, type SeriesMapInput } from "./series";
import type { Property } from "../types/chart";

export interface ChartMapInput extends Omit<CreateTileInput, "type"> {
  tableId: string;
  label?: Property | null;
  series?: readonly SeriesMapInput[];
}

export function buildChartMap(
  properties: Omit<ChartMapInput, "parentId" | "beforeId">,
): Y.Map<unknown> {
  const { tableId, label, series = [], ...baseProps } = properties;
  const map = buildBaseTileMap({ ...baseProps, type: "CHART" });
  map.set("tableId", tableId);
  map.set("label", label ?? null);

  const seriesMap = new Y.Map<Y.Map<unknown>>();
  for (const entry of series) {
    seriesMap.set(crypto.randomUUID(), buildSeriesMap(entry));
  }
  map.set("series", seriesMap);

  return map;
}
