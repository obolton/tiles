import * as Y from "yjs";
import { generateKeyBetween } from "jittered-fractional-indexing";
import { buildBaseTileMap, type CreateTileInput, type PlacementInput } from "./base";
import { buildSeriesMap, type SeriesMapInput } from "./series";
import { createId } from "../id";
import type { Property } from "../types/chart";

export interface ChartMapInput extends Omit<CreateTileInput, "type"> {
  tableId: string;
  label?: Property | null;
  series?: readonly SeriesMapInput[];
}

export function buildChartMap(
  properties: Omit<ChartMapInput, keyof PlacementInput>,
): Y.Map<unknown> {
  const { tableId, label, series = [], ...baseProps } = properties;
  const map = buildBaseTileMap({ ...baseProps, type: "CHART" });
  map.set("tableId", tableId);
  map.set("label", label ?? null);

  const seriesMap = new Y.Map<Y.Map<unknown>>();
  let order: string | null = null;
  for (const entry of series) {
    order = generateKeyBetween(order, null);
    seriesMap.set(createId(), buildSeriesMap(order, entry));
  }
  map.set("series", seriesMap);

  return map;
}
