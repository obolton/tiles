import type {
  ImageTile,
  VideoTile,
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
  | "video"
  | "text"
  | "place"
  | "link"
  | "heading"
  | "pageLink";
type TileProperties =
  | ImageTile
  | VideoTile
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
  video: Pick<VideoTile, "title"> | null;
  text: Pick<TextTile, "content" | "hue"> | null;
  place: Pick<PlaceTile, "name" | "lat" | "long" | "boundingBox"> | null;
  link: Pick<LinkTile, "title"> | null;
  heading: Pick<HeadingTile, "content"> | null;
  pageLink: Pick<PageLinkTile, "pageId"> | null;
};

export type ClientImageTile = ClientTileType<"IMAGE", "image", ImageTile>;
export type ClientVideoTile = ClientTileType<"VIDEO", "video", VideoTile>;
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
      hue: number | null;
      font: string | null;
      tiles: ClientThumbnailTile[];
    } | null;
  }
>;
export type ClientTile =
  | ClientImageTile
  | ClientVideoTile
  | ClientTextTile
  | ClientPlaceTile
  | ClientLinkTile
  | ClientHeadingTile
  | ClientPageLinkTile;
export type { TileType };
