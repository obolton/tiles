import type { TileBase } from "./base";

export interface PageLinkPage {
  id: string;
  title: string;
}

export interface PageLinkTile extends TileBase {
  type: "PAGE_LINK";
  linkedPage: PageLinkPage | null;
}
