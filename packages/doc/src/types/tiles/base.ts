import type {
  TileType,
  Sizing,
  Animation,
  FrameStyle,
  DockEdge,
} from "../enums";
import type { Color } from "../color";
import type { Fill } from "../fill";

export interface TileBase {
  id: string;
  type: TileType;
  sectionId: string | null;
  order: string;
  sizing: Sizing;
  x: number;
  y: number;
  width: number | null;
  height: number;
  rowSpan: number;
  startDate: string | null;
  endDate: string | null;
  lat: number | null;
  long: number | null;
  animation: Animation | null;
  frame: FrameStyle | null;
  cornerRadius: number | null;
  hide: boolean;
  dock: DockEdge | null;
  textColor: Color | null;
  background: Fill | null;
}
