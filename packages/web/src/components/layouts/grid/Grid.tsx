import { useRef } from "react";
import GridItem from "@/components/grid/GridItem";
import useEditable from "@/hooks/useEditable";
import useLayoutEditor from "@/hooks/useLayoutEditor";
import { useDragId } from "@/context/drag";
import { classNames } from "@/utils/css";
import styles from "./Grid.module.css";
import type { ClientTile } from "@/types/tiles";

interface GridProps {
  id?: string;
  className?: string;
  items: ClientTile[];
}

export default function Grid({ id, className, items }: GridProps) {
  const isEditable = useEditable();
  const ref = useRef<HTMLElement>(null);
  useLayoutEditor(ref, id);
  const dragId = useDragId();

  return (
    <section ref={ref} className={classNames(styles.grid, className)}>
      {items.map((tile) => (
        <GridItem
          key={tile.id}
          className={dragId === tile.placementId ? styles.dragging : undefined}
          id={tile.id}
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
