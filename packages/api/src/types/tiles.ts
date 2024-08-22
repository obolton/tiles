import type {
  ImageTile,
  VideoTile,
  TextTile,
  PlaceTile,
  LinkTile,
  HeadingTile,
  PageLinkTile,
  EventTile,
  Tile,
  TileType,
  Theme,
} from "@prisma/client";

type TilePropertiesKey =
  | "image"
  | "video"
  | "text"
  | "place"
  | "link"
  | "heading"
  | "pageLink"
  | "event";

type ClientTileType<
  Type extends TileType,
  PropertiesKey extends TilePropertiesKey,
  Properties extends object,
> = Pick<Tile, "id" | "type" | "position" | "columns" | "rows"> & {
  type: Type;
} & {
  [key in PropertiesKey]: Omit<
    Properties,
    "id" | "createdAt" | "updatedAt" | "tileId"
  >;
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
      author: { name: string; imageUrl: string | null };
      theme: Theme;
      hue: number | null;
      font: string | null;
      imageKey: string | null;
    } | null;
  }
>;
export type ClientEventTile = ClientTileType<
  "EVENT",
  "event",
  Omit<EventTile, "start" | "end"> & { start: string; end: string | null }
>;

export type ClientTile =
  | ClientImageTile
  | ClientVideoTile
  | ClientTextTile
  | ClientPlaceTile
  | ClientLinkTile
  | ClientHeadingTile
  | ClientPageLinkTile
  | ClientEventTile;

export type { TileType };
