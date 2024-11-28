import { useCallback, useEffect, useRef, useState } from "react";
import ImageTile from "@/components/tiles/ImageTile";
import VideoTile from "@/components/tiles/VideoTile";
import TextTile from "@/components/tiles/TextTile";
import MapTile from "@/components/tiles/MapTile";
import LinkTile from "@/components/tiles/LinkTile";
import styles from "./Stack.module.css";
import type { ClientCollection } from "@/types/tiles";
import GridItem from "@/components/grid/GridItem";
import type StackView from "@/components/collections/StackView";
import useEditable from "@/hooks/useEditable";
import type { DragDropEvent } from "@/utils/drag";
import useLayoutTransition from "@/hooks/useLayoutTransition";
import { moveElement } from "@/utils/arrays";
import client from "@/api/client";
import { handleError } from "@/utils/errors";
import { destroy, DEFAULT_TIMING } from "@/utils/animation/effects";

interface StackProps {
  items: ClientCollection["items"];
}

function getTileComponent(item: ClientCollection["items"][number]) {
  const props = {
    id: item.id,
  };

  if (item.text) {
    return <TextTile {...props} columns={1} text={item.text} />;
  }

  if (item.image) {
    return <ImageTile {...props} image={item.image} movable={false} />;
  }

  if (item.video) {
    return <VideoTile {...props} video={item.video} />;
  }

  if (item.link) {
    return <LinkTile {...props} link={item.link} />;
  }

  if (item.map) {
    return <MapTile {...props} map={item.map} />;
  }

  return null;
}

export default function Stack({ items: initialItems }: StackProps) {
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
        const id = dragSource.id;
        const position = Array.prototype.indexOf.call(
          element.children,
          dragSource,
        );
        try {
          await client.tiles.move.mutate({ id, position });
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
      await client.tiles.delete.mutate({ id });
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
        >
          {getTileComponent(item)}
        </GridItem>
      ))}
    </stack-view>
  );
}
