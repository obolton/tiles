import { useCallback } from "react";
import { TileType } from "@prisma/client";
import ImageTile from "./ImageTile";
import TextTile from "./TextTile";
import useEditable from "../../hooks/useEditable";
import { setSearchParams } from "../../utils/navigation";
import type { Tile as TileData } from "../../types/tiles";
import styles from "./Tile.module.css";

export type TileProps = {
  tile: TileData;
};

function getTileComponent(tile: TileData) {
  switch (tile.type) {
    case TileType.IMAGE:
      if (!tile.image) {
        throw new Error("Invalid image tile");
      }
      return <ImageTile {...tile.image} />;
    case TileType.TEXT:
      if (!tile.text) {
        throw new Error("Invalid text tile");
      }
      return <TextTile {...tile.text} />;
    default:
      return null;
  }
}

export default function Tile({ tile }: TileProps) {
  const isEditable = useEditable();
  const component = getTileComponent(tile);
  const edit = useCallback(
    () => setSearchParams({ modal: tile.type.toLowerCase(), tileId: tile.id }),
    [tile]
  );
  return (
    <div
      className={`editable ${styles.tile}`}
      data-tile-id={tile.id}
      data-tile={JSON.stringify(tile)}
      onClick={isEditable ? edit : undefined}
    >
      {component}
    </div>
  );
}
