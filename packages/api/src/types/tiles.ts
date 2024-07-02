import type {
  ImageTile,
  TextTile,
  PlaceTile,
  LinkTile,
  HeadingTile,
  PageLinkTile,
  Tile,
  TileType,
} from "@prisma/client";

type TilePropertiesKey =
  | "image"
  | "text"
  | "place"
  | "link"
  | "heading"
  | "pageLink";
type TileProperties =
  | ImageTile
  | TextTile
  | PlaceTile
  | LinkTile
  | HeadingTile
  | PageLinkTile;

type ClientTileType<
  Type extends TileType,
  PropertiesKey extends TilePropertiesKey,
  Properties extends TileProperties,
> = Pick<Tile, "id" | "type" | "position" | "columns" | "rows"> & {
  type: Type;
} & {
  [key in PropertiesKey]: Omit<
    Properties,
    "id" | "createdAt" | "updatedAt" | "tileId"
  >;
};

export type ClientThumbnailTile = Pick<
  Tile,
  "id" | "type" | "columns" | "rows"
> & {
  image: Pick<ImageTile, "imageKey" | "caption"> | null;
  text: Pick<TextTile, "content"> | null;
  place: Pick<PlaceTile, "name" | "thumbnailKey"> | null;
  link: Pick<LinkTile, "title"> | null;
  heading: Pick<HeadingTile, "content"> | null;
  pageLink: Pick<PageLinkTile, "pageId"> | null;
};

export type ClientImageTile = ClientTileType<"IMAGE", "image", ImageTile>;
export type ClientTextTile = ClientTileType<"TEXT", "text", TextTile>;
export type ClientPlaceTile = ClientTileType<"PLACE", "place", PlaceTile>;
export type ClientLinkTile = ClientTileType<"LINK", "link", LinkTile>;
export type ClientHeadingTile = ClientTileType<
  "HEADING",
  "heading",
  HeadingTile
>;
export type ClientPageLinkTile = ClientTileType<
  "PAGE_LINK",
  "pageLink",
  PageLinkTile & {
    page: {
      title: string;
      subtitle: string | null;
      tiles: ClientThumbnailTile[];
    } | null;
  }
>;
export type ClientTile =
  | ClientImageTile
  | ClientTextTile
  | ClientPlaceTile
  | ClientLinkTile
  | ClientHeadingTile
  | ClientPageLinkTile;
export type { TileType };
