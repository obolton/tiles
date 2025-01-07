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

    return () => abortController.abort();
  }, [startLayoutTransition]);

  const onDelete = useCallback(
    async (tileId: string) => {
      const pageId = document.body.dataset.pageId ?? "";
      await client.tiles.delete.mutate({ pageId, id: tileId });
      const element = document.querySelector(`[data-placement-id="${tileId}"]`);
      if (element) {
        destroy(element, {
          timing: { ...DEFAULT_TIMING, fill: "forwards" },
        });
      }
      startLayoutTransition(() => {
        setItems((prevTiles) =>
          prevTiles.filter((prevTile) => prevTile.id !== tileId),
        );
      });
    },
    [startLayoutTransition],
  );

  const onDragStart = (event: DragDropEvent) => {
    event.stopPropagation();
    Object.assign(event.state.data, {
      collectionId: id,
    });
  };

  const onDragEnter = (event: DragDropEvent) => {
    event.stopPropagation();
  };

  const onDrag = (event: DragDropEvent) => {
    event.stopPropagation();
    const element = ref.current;
    if (!element) {
      return;
    }
    const children = element.children;
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
        element.children,
        event.dragSource,
      );
      startLayoutTransition(() => {
        setItems((prevTiles) => moveElement(prevTiles, fromPosition, position));
      });
    }
  };

  const onDrop = async (event: DragDropEvent) => {
    event.stopPropagation();

    const {
      dragSource,
      state: { data },
    } = event;

    const element = ref.current;
    if (
      !element ||
      !("placementId" in data) ||
      typeof data.placementId !== "string"
    ) {
      return;
    }

    const tileId = data.placementId;
    const pageId = document.body.dataset.pageId ?? "";
    const previousCollectionId =
      "collectionId" in data && typeof data.collectionId === "string"
        ? data.collectionId
        : null;

    try {
      if (previousCollectionId === id) {
        const position = Array.prototype.indexOf.call(
          element.children,
          dragSource,
        );
        await client.tiles.move.mutate({ pageId, id: tileId, position });
      } else {
        const newItems = await client.collections.addToCollection.mutate({
          tileId,
          pageId,
          collectionId: id,
          position: 0,
        });

        setItems(newItems.items);
        window.dispatchEvent(
          new CustomEvent("tile:remove", { detail: [tileId] }),
        );
      }
    } catch (error) {
      handleError(error);
    }
  };

  return (
    <stack-view
      ref={ref}
      class={styles.stack}
      expandable="expandable"
      ondnd-dragstart={onDragStart}
      ondnd-dragenter={onDragEnter}
      ondnd-drag={onDrag}
      ondnd-drop={onDrop}
      data-drop-group={open ? "stack" : "root"}
    >
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
