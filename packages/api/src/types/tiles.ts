import type { ImageTile, TextTile, Tile, TileType } from "@prisma/client";

type TilePropertiesKey = "image" | "text";
type TileProperties = ImageTile | TextTile;

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
export type ClientTile = ClientImageTile | ClientTextTile;
