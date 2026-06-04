import * as Y from "yjs";
import { buildBaseTileMap, type CreateTileInput } from "./base";

export interface LinkMapInput extends Omit<CreateTileInput, "type"> {
  url: string;
  title: string | null;
  description: string | null;
  siteName: string | null;
  imageId: string | null;
}

export function buildLinkMap(
  properties: Omit<LinkMapInput, "parentId" | "beforeId">,
): Y.Map<unknown> {
  const {
    url,
    title,
    description,
    siteName,
    imageId,
    background,
    ...baseProps
  } = properties;
  const map = buildBaseTileMap({
    ...baseProps,
    type: "LINK",
    background: imageId ? { type: "image", imageId } : background,
  });
  map.set("url", url);
  map.set("title", title);
  map.set("description", description);
  map.set("siteName", siteName);
  map.set("imageId", imageId);
  return map;
}
