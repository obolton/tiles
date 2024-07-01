import { useCallback, useRef, useState } from "react";
import useEditable from "@/hooks/useEditable";
import useDraggable from "@/hooks/useDraggable";
import useResizable from "@/hooks/useResizable";
import { deleteTile } from "@/utils/edit";
import client from "@/api/client";
import DeleteButton from "./DeleteButton";
import styles from "./Tile.module.css";
import type { ClientTile } from "@/types/tiles";

export type TileProps = {
  children: React.ReactNode;
  tile: ClientTile;
};

export default function Tile({ tile, children }: TileProps) {
  const isEditable = useEditable();
  const ref = useRef<HTMLDivElement>(null);
  useDraggable(ref, isEditable);
  useResizable(ref, isEditable);
  const [isDeleted, setIsDeleted] = useState(false);

  const onDelete = useCallback(
    async (event: React.MouseEvent) => {
      event.stopPropagation();
      event.preventDefault();
      await client.tiles.delete.mutate({ id: tile.id });
      setIsDeleted(true);
    },
    [tile],
  );

  const onAnimationEnd = useCallback(
    (event: React.AnimationEvent) => {
      if (event.animationName === styles.disappear) {
        deleteTile(tile.id);
      }
    },
    [tile],
  );

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
      {children}
      {isEditable ? (
        <>
          <DeleteButton onPress={onDelete} />
          <div className="resize-handle" data-resize="true" />
        </>
      ) : null}
    </div>
  );
}
