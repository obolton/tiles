import { useCallback, useEffect, useRef, useState } from "react";
import styles from "./Stack.module.css";
import type { ClientCollection } from "@/types/tiles";
import GridItem from "@/components/grid/GridItem";
import type StackView from "@/components/expandable/StackView";
import useEditable from "@/hooks/useEditable";
import type { DragDropEvent } from "@/utils/drag";
import useLayoutTransition from "@/hooks/useLayoutTransition";
import { moveElement } from "@/utils/arrays";
import client from "@/api/client";
import { handleError } from "@/utils/errors";
import { destroy, DEFAULT_TIMING } from "@/utils/animation/effects";

interface StackProps {
  id: string;
  items: ClientCollection["items"];
}

export default function Stack({ id, items: initialItems }: StackProps) {
  const ref = useRef<StackView>(null);
  const [open, setOpen] = useState(false);
  const isEditable = useEditable();
  const { startLayoutTransition } = useLayoutTransition(ref);
  const [items, setItems] = useState(initialItems);

  useEffect(() => {
    const element = ref.current;
    const abortController = new AbortController();
    element?.addEventListener(
      "toggle",
      ({ newState }: ToggleEvent) => setOpen(newState === "open"),
      { signal: abortController.signal },
    );

    element?.addEventListener(
      "drag:drag-over",
      ({ target, dragSource }: DragDropEvent) => {
        if (target instanceof HTMLElement) {
          const fromPosition = Array.prototype.indexOf.call(
            element.children,
            dragSource,
          );
          const toPosition = Array.prototype.indexOf.call(
            element.children,
            target,
          );
          if (fromPosition < 0 || toPosition < 0) {
            return;
          }
          startLayoutTransition(() => {
            setItems((prevTiles) =>
              moveElement(prevTiles, fromPosition, toPosition),
            );
          });
        }
      },
      { signal: abortController.signal },
    );

    element?.addEventListener(
      "drag:drop",
      async ({ dragSource }: DragDropEvent) => {
        const id = dragSource.dataset.placementId ?? "";
        const position = Array.prototype.indexOf.call(
          element.children,
          dragSource,
        );
        try {
          const pageId = document.body.dataset.pageId ?? "";
          await client.tiles.move.mutate({ pageId, id, position });
        } catch (error) {
          handleError(error);
        }
      },
      { signal: abortController.signal },
    );

    return () => abortController.abort();
  }, [startLayoutTransition]);

  const onDelete = useCallback(
    async (id: string) => {
      const pageId = document.body.dataset.pageId ?? "";
      await client.tiles.delete.mutate({ pageId, id });
      const element = document.getElementById(id);
      if (element) {
        await destroy(element, {
          timing: { ...DEFAULT_TIMING, fill: "forwards" },
        });
      }
      startLayoutTransition(() => {
        setItems((prevTiles) =>
          prevTiles.filter((prevTile) => prevTile.id !== id),
        );
      });
    },
    [startLayoutTransition],
  );

  return (
    <stack-view ref={ref} class={styles.stack} expandable="expandable">
      {items.map((item, i) => (
        <GridItem
          className={styles.item}
          key={item.id}
          id={item.id}
          placementId={item.placementId}
          rows={1}
          columns={1}
          isEditable={isEditable && open}
          resizable={false}
          onDelete={onDelete}
          grow={false}
          dropGroup="stack"
          style={
            {
              "--index": i,
              "--angle": i === 0 ? 0 : `${((i * 123) % 20) - 10}deg`,
            } as React.CSSProperties
          }
          tile={item}
        />
      ))}
    </stack-view>
  );
}
