import { useCallback, useRef } from "react";
import useEditable from "@/hooks/useEditable";
import useDraggable from "@/hooks/useDraggable";
import useResizable from "@/hooks/useResizable";
import useScrollIntoView from "@/hooks/useScrollIntoView";
import { deleteTile } from "@/utils/edit";
import client from "@/api/client";
import DeleteButton from "./DeleteButton";
import { destroy } from "@/utils/animation/effects";
import styles from "./Tile.module.css";
import type { ClientTile } from "@/types/tiles";

export type TileProps = {
  children: React.ReactNode;
  tile: ClientTile;
  showBorder?: boolean;
  showInLightbox?: boolean;
  hue?: number | null;
};

export default function Tile({
  tile,
  children,
  hue,
  showBorder = true,
  showInLightbox = true,
}: TileProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isEditable = useEditable();
  useDraggable(ref, isEditable);
  useResizable(ref, isEditable);
  useScrollIntoView(ref);

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
      id={tile.id}
      ref={ref}
      className={`editable ${styles.tile} ${showBorder ? styles.border : ""} ${typeof hue === "number" ? styles.color : ""}`}
      style={
        {
          "--columns": tile.columns,
          "--rows": tile.rows,
          "--hue": typeof hue === "number" ? `${hue.toFixed(2)}deg` : undefined,
        } as React.CSSProperties
      }
      data-rows={tile.rows}
      data-columns={tile.columns}
      data-drop-target={isEditable ? "true" : undefined}
      data-tile-id={tile.id}
      data-tile={JSON.stringify(tile)}
      data-show-in-lightbox={showInLightbox ? "true" : undefined}
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
