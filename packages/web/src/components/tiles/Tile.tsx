import { useCallback, useRef, useState } from "react";
import { TileType } from "@prisma/client";
import ImageTile from "./ImageTile";
import TextTile from "./TextTile";
import PlaceTile from "./PlaceTile";
import LinkTile from "./LinkTile";
import Icon from "../icons/Icon";
import useEditable from "@/hooks/useEditable";
import useDraggable from "@/hooks/useDraggable";
import useResizable from "@/hooks/useResizable";
import { editTile, deleteTile } from "@/utils/edit";
import client from "@/api/client";
import deleteIcon from "@/icons/delete.svg";
import styles from "./Tile.module.css";
import type { ClientTile } from "@/types/tiles";

export type TileProps = {
  tile: ClientTile;
};

function getTileComponent(tile: ClientTile, openEditModal: () => void) {
  switch (tile.type) {
    case TileType.IMAGE:
      return <ImageTile {...tile} openEditModal={openEditModal} />;
    case TileType.TEXT:
      return <TextTile {...tile} />;
    case TileType.PLACE:
      return <PlaceTile {...tile} openEditModal={openEditModal} />;
    case TileType.LINK:
      return <LinkTile {...tile} openEditModal={openEditModal} />;
    default:
      throw new Error("Unknown tile type");
  }
}

export default function Tile({ tile }: TileProps) {
  const isEditable = useEditable();
  const ref = useRef<HTMLDivElement>(null);
  useDraggable(ref, isEditable);
  useResizable(ref, isEditable);
  const [isDeleted, setIsDeleted] = useState(false);

  const edit = useCallback(() => editTile(tile.id, tile.type), [tile]);

  const onDelete = useCallback(
    async (event: React.MouseEvent) => {
      event.stopPropagation();
      event.preventDefault();
      await client.tiles.delete.mutate({ id: tile.id });
      setIsDeleted(true);
    },
    [tile],
  );

  const onDeletePointerDown = useCallback((event: React.PointerEvent) => {
    event.stopPropagation();
    event.preventDefault();
  }, []);

  const onAnimationEnd = useCallback(
    (event: React.AnimationEvent) => {
      if (event.animationName === styles.disappear) {
        deleteTile(tile.id);
      }
    },
    [tile],
  );

  const component = getTileComponent(tile, edit);

  return (
    <div
      ref={ref}
      className={`editable ${styles.tile} ${isDeleted ? styles.deleted : ""}`}
      style={
        {
          "--columns": tile.columns,
          "--rows": tile.rows,
        } as React.CSSProperties
      }
      data-drop-target={isEditable ? "true" : undefined}
      data-tile-id={tile.id}
      data-tile={JSON.stringify(tile)}
      onAnimationEnd={onAnimationEnd}
    >
      <div className={styles.content}>{component}</div>
      {isEditable ? (
        <>
          <button
            className={styles["delete-button"]}
            type="button"
            onClick={onDelete}
            onPointerDownCapture={onDeletePointerDown}
          >
            <Icon src={deleteIcon.src} />
          </button>
          <div className="resize-handle" data-resize="true" />
        </>
      ) : null}
    </div>
  );
}
