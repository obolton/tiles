import { useRef } from "react";
import GridItem from "@/components/grid/GridItem";
import useEditable from "@/hooks/useEditable";
import useLayoutEditor from "@/hooks/useLayoutEditor";
import { useDragId } from "@/context/drag";
import styles from "./Grid.module.css";
import type { Tile } from "@/types/layout";

export interface GridProps {
  collectionId: string;
  items: Tile[];
  Placeholder?: React.ComponentType<Pick<GridProps, "collectionId">>;
}

export default function Grid({ collectionId, items, Placeholder }: GridProps) {
  const isEditable = useEditable();
  const ref = useRef<HTMLElement>(null);
  useLayoutEditor(ref, collectionId);
  const dragId = useDragId();

  return (
    <section
      ref={ref}
      className={styles.grid}
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
          rows={tile.rows}
          columns={tile.columns}
          deletable={isEditable}
          draggable={isEditable}
          resizable={isEditable}
          allowDrop
          grow={tile.type === "TEXT" && tile.columns === 3}
          tile={tile}
        />
      ))}
    </section>
  );
}
