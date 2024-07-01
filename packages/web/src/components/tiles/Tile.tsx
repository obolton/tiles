import { useCallback, useRef } from "react";
import useEditable from "@/hooks/useEditable";
import useDraggable from "@/hooks/useDraggable";
import useResizable from "@/hooks/useResizable";
import { deleteTile } from "@/utils/edit";
import client from "@/api/client";
import DeleteButton from "./DeleteButton";
import { destroy } from "@/utils/animation/effects";
import styles from "./Tile.module.css";
import type { ClientTile } from "@/types/tiles";

export type TileProps = {
  children: React.ReactNode;
  tile: ClientTile;
};

export default function Tile({ tile, children }: TileProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isEditable = useEditable();
  useDraggable(ref, isEditable);
  useResizable(ref, isEditable);

  const onDelete = useCallback(
    async (event: React.MouseEvent) => {
      if (!ref.current) {
        return;
      }
      event.stopPropagation();
      event.preventDefault();
      await client.tiles.delete.mutate({ id: tile.id });
      await destroy(ref.current);
      deleteTile(tile.id);
    },
    [tile],
  );

  return (
    <div
      ref={ref}
      className={`editable ${styles.tile}`}
      style={
        {
          "--columns": tile.columns,
          "--rows": tile.rows,
        } as React.CSSProperties
      }
      data-drop-target={isEditable ? "true" : undefined}
      data-tile-id={tile.id}
      data-tile={JSON.stringify(tile)}
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
