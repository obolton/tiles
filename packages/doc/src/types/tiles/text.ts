import type { RichText } from "../richText";
import type { TileBase } from "./base";

export const VerticalAlignment = {
  TOP: "TOP",
  CENTER: "CENTER",
  BOTTOM: "BOTTOM",
} as const;
export type VerticalAlignment =
  (typeof VerticalAlignment)[keyof typeof VerticalAlignment];

export interface TextTile extends TileBase {
  type: "TEXT";
  content: RichText;
  align: VerticalAlignment;
}
