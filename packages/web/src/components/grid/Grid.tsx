import { useRef } from "react";
import TileButtons from "@/components/menu/TileButtons";
import GridItem from "./GridItem";
import useEditable from "@/hooks/useEditable";
import useLayoutEditor from "@/hooks/useLayoutEditor";
import { useDragId } from "@/context/drag";
import styles from "./Grid.module.css";
import type { ClientTile } from "@/types/tiles";

interface GridProps {
  tiles: ClientTile[];
}

export default function Grid({ tiles }: GridProps) {
  const isEditable = useEditable();
  const ref = useRef<HTMLElement>(null);
  useLayoutEditor(ref, null);
  const dragId = useDragId();

  return (
    <section ref={ref} className={styles.grid}>
      {tiles.length === 0 && (
        <div className={styles.placeholder}>
          {isEditable ? (
            <>
              <p>
                There’s nothing here yet. Get starting by adding some content.
              </p>
              <div className={styles["placeholder-buttons"]}>
                <TileButtons tooltipPosition="bottom" />
              </div>
            </>
          ) : (
            <p>This page is empty.</p>
          )}
        </div>
      )}

      {tiles.map((tile) => (
        <GridItem
          key={tile.id}
          className={dragId === tile.placementId ? styles.dragging : undefined}
          id={tile.id}
          placementId={tile.placementId}
          rows={tile.rows}
          columns={tile.columns}
          isEditable={isEditable}
          resizable={isEditable}
          allowDrop
          grow={tile.type === "TEXT" && tile.columns === 3}
          tile={tile}
        />
      ))}
    </section>
  );
}
