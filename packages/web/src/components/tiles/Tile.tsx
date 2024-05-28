import { TileType } from "@prisma/client";
import ImageTile, { type ImageTileProps } from "./ImageTile";

export type TileProps = {
  id: string;
  type: TileType;
  image: ImageTileProps | null;
};

export default function Tile({ type, image }: TileProps) {
  switch (type) {
    case TileType.IMAGE:
      if (!image) {
        throw new Error("Image props missing");
      }
      return <ImageTile {...image} />;
    default:
      return null;
  }
}
