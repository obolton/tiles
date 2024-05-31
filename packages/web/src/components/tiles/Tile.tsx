import { useCallback, useRef } from "react";
import { TileType } from "@prisma/client";
import ImageTile from "./ImageTile";
import TextTile from "./TextTile";
import useEditable from "../../hooks/useEditable";
import useDraggable from "../../hooks/useDraggable";
import { setSearchParams } from "../../utils/navigation";
import type { ClientTile } from "../../types/tiles";
import styles from "./Tile.module.css";

export type TileProps = {
  pageId: string;
  tile: ClientTile;
};

function getTileComponent(pageId: string, tile: ClientTile) {
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

export default function Tile({ pageId, tile }: TileProps) {
  const isEditable = useEditable();
  const ref = useRef<HTMLDivElement>(null);
  useDraggable(ref, isEditable);

  const edit = useCallback(
    () => setSearchParams({ modal: tile.type.toLowerCase(), tileId: tile.id }),
    [tile]
  );

  const component = getTileComponent(pageId, tile);

  return (
    <div
      ref={ref}
      className={`editable ${styles.tile}`}
      data-drop-target={isEditable ? "true" : undefined}
      data-tile-id={tile.id}
      data-tile={JSON.stringify(tile)}
      onClick={isEditable ? edit : undefined}
    >
      {component}
    </div>
  );
}
