import type { Fill } from "../fill";
import type { TileBase } from "./base";

export interface PageLinkPage {
  id: string;
  title: string;
  background: Fill | null;
  font: string | null;
}

export interface PageLinkTile extends TileBase {
  type: "PAGE_LINK";
  linkedPage: PageLinkPage | null;
}
