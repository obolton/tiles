import * as Y from "yjs";
import { buildBaseTileMap, type CreateTileInput, type PlacementInput } from "./base";

export interface LinkMapInput extends Omit<CreateTileInput, "type"> {
  url: string;
  title: string | null;
  description: string | null;
  siteName: string | null;
  imageId: string | null;
}

export function buildLinkMap(properties: Omit<LinkMapInput, keyof PlacementInput>): Y.Map<unknown> {
  const { url, title, description, siteName, imageId, background, ...baseProps } = properties;
  const map = buildBaseTileMap({
    ...baseProps,
    type: "LINK",
    // Override default AUTO sizing, which has no intrinsic height for a link card
    sizing: baseProps.sizing ?? "CUSTOM",
    background: imageId ? { type: "image", imageId } : background,
  });
  map.set("url", url);
  map.set("title", title);
  map.set("description", description);
  map.set("siteName", siteName);
  map.set("imageId", imageId);
  return map;
}
