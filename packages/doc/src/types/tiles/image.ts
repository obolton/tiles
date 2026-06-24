import type { RichText } from "../richText";
import type { ImageSize } from "../image";
import type { TileBase } from "./base";

export interface ImageTile extends TileBase {
  type: "IMAGE";
  imageId: string | null;
  image: ImageSize;
  alt: string | null;
  originX: number;
  originY: number;
  text: RichText | null;
}
