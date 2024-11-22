import { useCallback, useEffect, useMemo, useRef } from "react";
import useEditable from "@/hooks/useEditable";
import useScrollIntoView from "@/hooks/useScrollIntoView";
import GridItem from "@/components/grid/GridItem";
import { deleteTile } from "@/utils/edit";
import client from "@/api/client";
import { destroy, DEFAULT_TIMING } from "@/utils/animation/effects";
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
  useScrollIntoView(ref);

  const onDelete = useCallback(async () => {
    if (!ref.current) {
      return;
    }
    await client.tiles.delete.mutate({ id });
    await destroy(ref.current, {
      timing: { ...DEFAULT_TIMING, fill: "forwards" },
    });
    deleteTile(id);
  }, [id]);

  useEffect(() => {
    const element = ref.current;
    if (!element || !allowEdit || !onDrop) {
      return;
    }
    element.addEventListener("drag:drop-on", onDrop);
    return () => element.removeEventListener("drag:drop-on", onDrop);
  }, [allowEdit, onDrop]);

  const style = useMemo(
    () =>
      ({
        "--hue": typeof hue === "number" ? `${hue.toFixed(2)}deg` : undefined,
      }) as React.CSSProperties,
    [hue],
  );

  return (
    <GridItem
      className={styles.item}
      id={id}
      rows={rows}
      columns={columns}
      popOut={expandable}
      popOutOrigin={origin}
      isEditable={isEditable}
      grow={variableHeight}
      onDelete={onDelete}
    >
      <div
        ref={ref}
        className={classNames(
          styles.contents,
          showBorder && styles.border,
          theme === "LIGHT"
            ? styles.light
            : theme === "DARK"
              ? styles.dark
              : styles.color,
        )}
        data-font={font}
        style={style}
      >
        {children}
      </div>
    </GridItem>
  );
}
