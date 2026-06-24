import type { TileBase } from "./base";

export interface LinkTile extends TileBase {
  type: "LINK";
  url: string;
  title: string | null;
  description: string | null;
  siteName: string | null;
  imageId: string | null;
}
