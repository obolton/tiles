import { TileType } from "@prisma/client";
import ImageTile, { type ImageTileProps } from "./ImageTile";
import TextTile, { type TextTileProps } from "./TextTile";

export type TileProps = {
  id: string;
  type: TileType;
  image: ImageTileProps | null;
  text: TextTileProps | null;
};

export default function Tile({ type, image, text }: TileProps) {
  switch (type) {
    case TileType.IMAGE:
      if (!image) {
        throw new Error("Invalid image tile");
      }
      return <ImageTile {...image} />;
    case TileType.TEXT:
      if (!text) {
        throw new Error("Invalid text tile");
      }
      return <TextTile {...text} />;
    default:
      return null;
  }
}
