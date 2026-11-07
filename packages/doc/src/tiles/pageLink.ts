import * as Y from "yjs";
import { buildBaseTileMap, type CreateTileInput, type PlacementInput } from "./base";

export interface LinkedPage {
  id: string;
  title: string;
}

export interface PageLinkMapInput extends Omit<CreateTileInput, "type"> {
  linkedPage: LinkedPage;
}

export function buildPageLinkMap(
  properties: Omit<PageLinkMapInput, keyof PlacementInput>,
): Y.Map<unknown> {
  const { linkedPage, ...baseProps } = properties;
  const map = buildBaseTileMap({ ...baseProps, type: "PAGE_LINK" });
  map.set("linkedPage", linkedPage);
  return map;
}
