import * as Y from "yjs";
import { buildBaseTileMap, type CreateTileInput } from "./base";
import type { Layout, MapStyle } from "../types/tiles/section";

export interface SectionMapInput extends Omit<CreateTileInput, "type"> {
  layout?: Layout;
  mapStyle?: MapStyle | null;
  columns?: number | null;
}

export function buildSectionMap(
  properties: Omit<SectionMapInput, "parentId" | "beforeId">,
): Y.Map<unknown> {
  const map = buildBaseTileMap({ ...properties, type: "SECTION" });
  map.set("layout", properties.layout ?? "VERTICAL");
  map.set("mapStyle", properties.mapStyle ?? null);
  map.set("columns", properties.columns ?? null);
  return map;
}
