import { useMemo, useRef } from "react";
import GridItem from "@/components/grid/GridItem";
import useEditable from "@/hooks/useEditable";
import useLayoutEditor from "@/hooks/useLayoutEditor";
import { useDragId } from "@/context/drag";
import styles from "./Grid.module.css";
import { classNames } from "@/utils/css";
import type { Tile } from "@/types/layout";

export interface GridProps {
  collectionId: string;
  items: Tile[];
  columns?: number;
  minColumnSpan?: number;
  minRowSpan?: number;
  Placeholder?: React.ComponentType<Pick<GridProps, "collectionId">>;
}

export default function Grid({
  collectionId,
  items,
  columns = 3,
  minColumnSpan = 1,
  minRowSpan = 1,
  Placeholder,
}: GridProps) {
  const isEditable = useEditable();
  const ref = useRef<HTMLElement>(null);
  useLayoutEditor(ref, collectionId);
  const dragId = useDragId();

  const style = useMemo(
    () =>
      ({
        "--columns": columns,
      }) as React.CSSProperties,
    [columns],
  );

  return (
    <section
      ref={ref}
      className={classNames(
        styles.grid,
        columns === 1 && styles["auto-height"],
      )}
      style={style}
      data-drop={isEditable ? "true" : undefined}
    >
      {items.length === 0 && Placeholder ? (
        <Placeholder collectionId={collectionId} />
      ) : null}

      {items.map((tile) => (
        <GridItem
          key={tile.id}
          className={dragId === tile.placementId ? styles.dragging : undefined}
          id={tile.id}
          collectionId={collectionId}
          placementId={tile.placementId}
          rows={Math.min(Math.max(tile.rows, minRowSpan), columns)}
          columns={Math.min(Math.max(tile.columns, minColumnSpan), columns)}
          deletable={isEditable}
          draggable={isEditable}
          resizable={isEditable}
          allowDrop
          grow={tile.type === "TEXT" && columns === 1}
          tile={tile}
        />
      ))}
    </section>
  );
}
