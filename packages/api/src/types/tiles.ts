import type { ImageTile, TextTile, TileType } from "@prisma/client";

type TileData<T> = Omit<T, "createdAt" | "updatedAt" | "tileId">;

export type ImageTileData = {
  id: string;
  type: "IMAGE";
  image: TileData<ImageTile>;
};

export type TextTileData = {
  id: string;
  type: "TEXT";
  text: TileData<TextTile>;
};

export type Tile = ImageTileData | TextTileData;

export type { TileType };
