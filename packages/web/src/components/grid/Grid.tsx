import { useCallback, useEffect, useRef, useState } from "react";
import useLayoutTransition, {
  type AnimateLayoutOptions,
} from "@/hooks/useLayoutTransition";
import useElementSizeRef from "@/hooks/useElementSizeRef";
import { scrollIntoView } from "@/hooks/useScrollIntoView";
import { moveElement } from "@/utils/arrays";
import styles from "./Grid.module.css";
import type { ClientTile } from "@/types/tiles";
import type { DragDropEvent } from "@/utils/drag";
import type { ResizeEvent } from "@/utils/resize";
import { viewTransition } from "@/utils/transitions";
import useEditable from "@/hooks/useEditable";
import GridItem from "./GridItem";
import { destroy, DEFAULT_TIMING } from "@/utils/animation/effects";
import { handleError } from "@/utils/errors";
import TileButtons from "@/components/menu/TileButtons";
import { useEditor } from "@/context/editor";

interface GridProps {
  tiles: ClientTile[];
}

const LAYOUT_TRANSITION_OPTIONS: AnimateLayoutOptions = {
  attributes: ["data-rows", "data-columns"],
};

export default function Grid({ tiles: initialTiles }: GridProps) {
  const editor = useEditor();
  const ref = useRef<HTMLElement>(null);
  const sizeRef = useElementSizeRef(ref);
  const [tiles, setTiles] = useState(initialTiles);
  const { startLayoutTransition } = useLayoutTransition(
    ref,
    LAYOUT_TRANSITION_OPTIONS,
  );
  const isEditable = useEditable();

  const onDelete = useCallback(
    async (id: string) => {
      await editor.deleteTile(id);
      const element = document.querySelector<HTMLElement>(
        `[data-placement-id="${id}"]`,
      );
      if (element) {
        destroy(element, {
          timing: { ...DEFAULT_TIMING, fill: "forwards" },
        });
      }

      const adjacentTileId =
        element?.previousElementSibling?.id || element?.nextElementSibling?.id;
      startLayoutTransition(() => {
        setTiles((prevTiles) =>
          prevTiles.filter((prevTile) => prevTile.placementId !== id),
        );
        if (adjacentTileId) {
          scrollIntoView(adjacentTileId);
        }
      });
    },
    [startLayoutTransition],
  );

  useEffect(() => {
    const create = (event: Event) => {
      const { detail: tile } = event as CustomEvent<ClientTile>;
      setTiles((prevTiles) => [...prevTiles, tile]);
      scrollIntoView(tile.id);
    };
    const update = (event: Event) => {
      const { detail: tile } = event as CustomEvent<ClientTile>;
      setTiles((prevTiles) =>
        prevTiles.map((prevTile) =>
          prevTile.id === tile.id ? { ...prevTile, ...tile } : prevTile,
        ),
      );
    };
    const remove = (event: Event) => {
      const { detail: tileIds } = event as CustomEvent<string[]>;
      startLayoutTransition(() => {
        setTiles((prevTiles) =>
          prevTiles.filter(
            (prevTile) => !tileIds.includes(prevTile.placementId),
          ),
        );
      });
    };
    const drop = async (event: DragDropEvent) => {
      const {
        dragSource,
        state: { data },
      } = event;
      if (
        ref.current &&
        "placementId" in data &&
        typeof data.placementId === "string"
      ) {
        const position = Array.prototype.indexOf.call(
          ref.current.children,
          dragSource,
        );
        try {
          await editor.moveTile(data.placementId, position);
        } catch (error) {
          handleError(error);
        }
      }
    };
    const resize = (event: ResizeEvent) => {
      const { target, size } = event;
      if (
        !(target instanceof HTMLElement) ||
        !target.id ||
        !sizeRef.current ||
        !size
      ) {
        return;
      }
      const id = target.dataset.placementId;
      const columnWidth = sizeRef.current.width / 3;
      const columns = Math.round(size.width / columnWidth);
      const rows = Math.round(size.height / columnWidth);
      const tile = tiles.find((tile) => tile.placementId === id);

      if (!tile) {
        return;
      }

      if (columns !== tile.columns || rows != tile.rows) {
        viewTransition(() => {
          setTiles((prevTiles) =>
            prevTiles.map((prevTile) =>
              prevTile.placementId === id
                ? { ...prevTile, columns, rows }
                : prevTile,
            ),
          );
        });
      }
    };
    const resizeEnd = async (event: ResizeEvent) => {
      const { target, size } = event;
      if (
        !(target instanceof HTMLElement) ||
        !sizeRef.current ||
        !size ||
        !target.id
      ) {
        return;
      }
      const id = target.dataset.placementId ?? "";
      const columnWidth = sizeRef.current.width / 3;
      const columns = Math.max(Math.round(size.width / columnWidth), 1);
      const rows = Math.max(Math.round(size.height / columnWidth), 1);
      await editor.resizeTile(id, columns, rows);
    };

    const dragMove = (event: DragDropEvent) => {
      if (!ref.current || event.dropTarget) {
        return;
      }
      const children = ref.current.children;
      let position = children.length - 1;
      for (let i = 0; i < children.length; i++) {
        const child = children[i]!;
        // TODO: cache rects
        const bounds = child.getBoundingClientRect();
        if (
          event.hitY < bounds.top ||
          (event.hitY <= bounds.bottom && event.hitX <= bounds.right)
        ) {
          if (child === event.dragSource) {
            return;
          }
          position = i;
          break;
        }
      }
      if (position >= 0) {
        const fromPosition = Array.prototype.indexOf.call(
          ref.current.children,
          event.dragSource,
        );
        startLayoutTransition(() => {
          setTiles((prevTiles) =>
            moveElement(prevTiles, fromPosition, position),
          );
        });
      }
    };

    const element = ref.current;
    const abortController = new AbortController();
    const { signal } = abortController;
    window.addEventListener("tile:create", create, { signal });
    window.addEventListener("tile:update", update, { signal });
    window.addEventListener("tile:remove", remove, { signal });
    element?.addEventListener("dnd-drop", drop, { signal });
    element?.addEventListener("dnd-drag", dragMove, { signal });
    window.addEventListener("resize:resize", resize, { signal });
    window.addEventListener("resize:end", resizeEnd, { signal });
    return () => abortController.abort();
  }, [sizeRef, startLayoutTransition, tiles]);

  return (
    <section className={styles.grid} ref={ref} data-drop-group="root">
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
          id={tile.id}
          placementId={tile.placementId}
          rows={tile.rows}
          columns={tile.columns}
          isEditable={isEditable}
          resizable={isEditable}
          onDelete={onDelete}
          grow={tile.type === "TEXT" && tile.columns === 3}
          dropGroup={isEditable ? "root" : undefined}
          tile={tile}
        />
      ))}
    </section>
  );
}
