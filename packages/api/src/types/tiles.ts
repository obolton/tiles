import type {
  ImageTile,
  TextTile,
  PlaceTile,
  LinkTile,
  HeadingTile,
  Tile,
  TileType,
} from "@prisma/client";

type TilePropertiesKey = "image" | "text" | "place" | "link" | "heading";
type TileProperties = ImageTile | TextTile | PlaceTile | LinkTile | HeadingTile;

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

export type ClientImageTile = ClientTileType<"IMAGE", "image", ImageTile>;
export type ClientTextTile = ClientTileType<"TEXT", "text", TextTile>;
export type ClientPlaceTile = ClientTileType<"PLACE", "place", PlaceTile>;
export type ClientLinkTile = ClientTileType<"LINK", "link", LinkTile>;
export type ClientHeadingTile = ClientTileType<
  "HEADING",
  "heading",
  HeadingTile
>;
export type ClientTile =
  | ClientImageTile
  | ClientTextTile
  | ClientPlaceTile
  | ClientLinkTile
  | ClientHeadingTile;
export type { TileType };
