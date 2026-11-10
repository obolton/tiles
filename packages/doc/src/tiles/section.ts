import * as Y from "yjs";
import { buildBaseTileMap, type CreateTileInput, type PlacementInput } from "./base";
import type { Layout, MapStyle } from "../types/enums";

export interface SectionMapInput extends Omit<CreateTileInput, "type"> {
  layout?: Layout;
  mapStyle?: MapStyle | null;
  columns?: number | null;
}

export function buildSectionMap(
  properties: Omit<SectionMapInput, keyof PlacementInput>,
): Y.Map<unknown> {
  // Sections lay out their contents absolutely, so they have no intrinsic height to auto-size to
  const map = buildBaseTileMap({
    ...properties,
    sizing: properties.sizing ?? "CUSTOM",
    type: "SECTION",
  });
  map.set("layout", properties.layout ?? "VERTICAL");
  map.set("mapStyle", properties.mapStyle ?? null);
  map.set("columns", properties.columns ?? null);
  return map;
}
