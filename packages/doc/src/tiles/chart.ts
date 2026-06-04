import * as Y from "yjs";
import { buildBaseTileMap, type CreateTileInput } from "./base";
import type { Property } from "../types/chart";

export interface ChartMapInput extends Omit<CreateTileInput, "type"> {
  tableId: string;
  label?: Property | null;
}

export function buildChartMap(
  properties: Omit<ChartMapInput, "parentId" | "beforeId">,
): Y.Map<unknown> {
  const { tableId, label, ...baseProps } = properties;
  const map = buildBaseTileMap({ ...baseProps, type: "CHART" });
  map.set("tableId", tableId);
  map.set("label", label ?? null);
  map.set("series", new Y.Map<Y.Map<unknown>>());
  return map;
}
