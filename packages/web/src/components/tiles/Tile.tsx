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
import { classNames } from "@/utils/css";
import type { Theme } from "@/types/pages";

export type TileProps = {
  id: string;
  rows?: number;
  columns?: number;
  children: React.ReactNode;
  showBorder?: boolean;
  showInLightbox?: boolean;
  fullWidth?: boolean;
  theme?: Theme | null;
  hue?: number | null;
  font?: string | null;
  variableHeight?: boolean;
};

export default function Tile({
  id,
  children,
  theme,
  hue,
  font,
  showBorder = true,
  showInLightbox = true,
  fullWidth = false,
  variableHeight = false,
  rows = 1,
  columns = 1,
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
      await client.tiles.delete.mutate({ id });
      await destroy(ref.current);
      deleteTile(id);
    },
    [id],
  );

  return (
    <div
      id={id}
      ref={ref}
      className={classNames(
        "editable",
        styles.tile,
        showBorder && styles.border,
        theme === "LIGHT"
          ? styles.light
          : theme === "DARK"
            ? styles.dark
            : styles.color,
        fullWidth && styles["full-width"],
        variableHeight && styles["variable-height"],
      )}
      style={
        {
          "--columns": columns,
          "--rows": rows,
          "--hue": typeof hue === "number" ? `${hue.toFixed(2)}deg` : undefined,
        } as React.CSSProperties
      }
      data-rows={rows}
      data-columns={columns}
      data-drop-target={isEditable ? "true" : undefined}
      data-tile-id={id}
      data-show-in-lightbox={showInLightbox ? "true" : undefined}
      data-font={font}
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
