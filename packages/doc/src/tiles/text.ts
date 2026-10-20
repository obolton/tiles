import * as Y from "yjs";
import { buildBaseTileMap, type CreateTileInput } from "./base";
import type { VerticalAlignment } from "../types/enums";

export interface TextMapInput extends Omit<CreateTileInput, "type"> {
  align?: VerticalAlignment;
}

export function buildTextMap(
  properties: Omit<TextMapInput, "parentId" | "beforeId">,
): Y.Map<unknown> {
  const { align, ...baseProps } = properties;
  const map = buildBaseTileMap({ ...baseProps, type: "TEXT" });
  map.set("align", align ?? "TOP");
  map.set("content", new Y.XmlFragment());
  return map;
}
