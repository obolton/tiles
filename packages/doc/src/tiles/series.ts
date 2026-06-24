import * as Y from "yjs";
import type { ChartSeriesType } from "../types/tiles/chart";
import type { Property } from "../types/chart";
import type { ColorFill, GradientFill } from "../types/fill";

export interface SeriesMapInput {
  type: ChartSeriesType;
  column: Property;
  fill: ColorFill | GradientFill | null;
}

export function buildSeriesMap(
  order: string,
  input: SeriesMapInput,
): Y.Map<unknown> {
  const map = new Y.Map<unknown>();
  map.set("order", order);
  map.set("type", input.type);
  map.set("column", input.column);
  map.set("fill", input.fill);
  return map;
}
