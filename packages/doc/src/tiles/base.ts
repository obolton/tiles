import * as Y from "yjs";
import type { Sizing, Animation, FrameStyle, TileType } from "../types/enums";
import type { Color } from "../types/color";
import type { Fill } from "../types/fill";

export interface CreateTileInput {
  type: TileType;
  id?: string;
  parentId?: string | null;
  beforeId?: string | null;
  sizing?: Sizing;
  x?: number;
  y?: number;
  width?: number | null;
  height?: number;
  rowSpan?: number;
  hide?: boolean;
  startDate?: string;
  endDate?: string;
  coordinates?: { lat: number; long: number } | null;
  animation?: Animation | null;
  frame?: FrameStyle | null;
  cornerRadius?: number;
  textColor?: Color | null;
  background?: Fill | null;
}

export type BaseTileInput = Omit<CreateTileInput, "parentId" | "beforeId">;

export function buildBaseTileMap(properties: BaseTileInput): Y.Map<unknown> {
  const map = new Y.Map<unknown>();

  map.set("type", properties.type);
  if (properties.id !== undefined) {
    map.set("id", properties.id);
  }
  map.set("sizing", properties.sizing ?? "AUTO");
  map.set("x", properties.x ?? 0);
  map.set("y", properties.y ?? 0);
  map.set("width", properties.width === undefined ? 0 : properties.width);
  map.set("height", properties.height ?? 0);
  map.set("rowSpan", properties.rowSpan ?? 0);
  map.set("hide", properties.hide ?? false);
  map.set("startDate", properties.startDate ?? null);
  map.set("endDate", properties.endDate ?? null);
  map.set("coordinates", properties.coordinates ?? null);
  map.set("animation", properties.animation ?? null);
  map.set("frame", properties.frame ?? null);
  map.set("cornerRadius", properties.cornerRadius ?? 0);
  map.set("textColor", properties.textColor ?? null);
  map.set("background", properties.background ?? null);

  return map;
}
