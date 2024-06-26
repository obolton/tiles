import { useCallback, useRef, useState } from "react";
import { TileType } from "@prisma/client";
import ImageTile from "./ImageTile";
import TextTile from "./TextTile";
import PlaceTile from "./PlaceTile";
import LinkTile from "./LinkTile";
import Icon from "../icons/Icon";
import useEditable from "../../hooks/useEditable";
import useDraggable from "../../hooks/useDraggable";
import useResizable from "../../hooks/useResizable";
import { editTile, deleteTile } from "../../utils/edit";
import client from "../../api/client";
import deleteIcon from "../../icons/delete.svg";
import styles from "./Tile.module.css";
import type { ClientTile } from "../../types/tiles";

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
    case TileType.PLACE:
      if (!tile.place) {
        throw new Error("Invalid place tile");
      }
      return <PlaceTile {...tile.place} />;
    case TileType.LINK:
      if (!tile.link) {
        throw new Error("Invalid link tile");
      }
      return <LinkTile {...tile.link} />;
    default:
      return null;
  }
}

export default function Tile({ pageId, tile }: TileProps) {
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
      await client.tiles.delete.mutate({ id: tile.id, pageId });
      setIsDeleted(true);
    },
    [tile, pageId],
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

  const component = getTileComponent(pageId, tile);

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
      onClick={isEditable ? edit : undefined}
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
