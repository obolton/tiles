import { useCallback, useEffect, useRef } from "react";
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
import type { DragDropEvent } from "@/utils/drag";

export type TileProps = {
  id: string;
  rows?: number;
  columns?: number;
  children?: React.ReactNode;
  showBorder?: boolean;
  showInLightbox?: boolean;
  fullWidth?: boolean;
  theme?: Theme | null;
  hue?: number | null;
  font?: string | null;
  variableHeight?: boolean;
  allowEdit?: boolean;
  onDrop?: (event: DragDropEvent) => void;
  expandable?: boolean;
  origin?: "center" | "top-left";
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
  allowEdit = true,
  rows = 1,
  columns = 1,
  onDrop,
  expandable = false,
  origin = "center",
}: TileProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isEditable = useEditable() && allowEdit;
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

  useEffect(() => {
    const element = ref.current;
    if (!element || !allowEdit || !onDrop) {
      return;
    }
    element.addEventListener("drag:drop-on", onDrop);
    return () => element.removeEventListener("drag:drop-on", onDrop);
  }, [allowEdit, onDrop]);

  return (
    <pop-out
      expandable={expandable ? "expandable" : undefined}
      id={id}
      ref={ref}
      class={classNames(
        styles.tile,
        allowEdit && styles["allow-edit"],
        fullWidth && styles["full-width"],
        variableHeight && styles["variable-height"],
      )}
      tabindex="0"
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
      origin={origin}
    >
      <div
        className={classNames(
          styles.contents,
          showBorder && styles.border,
          theme === "LIGHT"
            ? styles.light
            : theme === "DARK"
              ? styles.dark
              : styles.color,
          fullWidth && styles["full-width"],
          variableHeight && styles["variable-height"],
        )}
      >
        {children}
        {isEditable ? (
          <>
            <DeleteButton onPress={onDelete} />
            <div className="resize-handle" data-resize="true" />
          </>
        ) : null}
      </div>
    </pop-out>
  );
}
