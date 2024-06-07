import type {
  ImageTile,
  TextTile,
  PlaceTile,
  Tile,
  TileType,
} from "@prisma/client";

type TilePropertiesKey = "image" | "text" | "place";
type TileProperties = ImageTile | TextTile | PlaceTile;

type ClientTileType<
  Type extends TileType,
  PropertiesKey extends TilePropertiesKey,
  Properties extends TileProperties
> = Pick<Tile, "id" | "position" | "type"> & {
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
export type ClientTile = ClientImageTile | ClientTextTile | ClientPlaceTile;
export type { TileType };
