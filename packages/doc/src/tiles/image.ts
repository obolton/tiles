import * as Y from "yjs";
import { buildBaseTileMap, type CreateTileInput } from "./base";
import type { ImageSize } from "../types/image";
import type { RichTextValue } from "../types/richText";

export interface ImageMapInput extends Omit<CreateTileInput, "type"> {
  imageId: string;
  size: ImageSize;
  alt?: string | null;
  text?: RichTextValue | null;
}

export function buildImageMap(
  properties: Omit<ImageMapInput, "parentId" | "beforeId">,
): Y.Map<unknown> {
  const { imageId, size, alt, text, ...baseProps } = properties;
  const map = buildBaseTileMap({ ...baseProps, type: "IMAGE" });
  map.set("imageId", imageId);
  map.set("size", size);
  map.set("alt", alt ?? null);
  map.set("text", text ?? null);
  map.set("origin", { x: 0, y: 0 });
  return map;
}
