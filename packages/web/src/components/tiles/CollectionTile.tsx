import { useCallback, useEffect, useRef, useState } from "react";
import Tile, { type TileProps } from "./Tile";
import ImageTile from "@/components/tiles/ImageTile";
import VideoTile from "@/components/tiles/VideoTile";
import TextTile from "@/components/tiles/TextTile";
import PlaceTile from "@/components/tiles/PlaceTile";
import LinkTile from "@/components/tiles/LinkTile";
import client from "@/api/client";
import styles from "./CollectionTile.module.css";
import type StackView from "@/components/collections/StackView";
import type { ClientCollection } from "@/types/tiles";
import type { DragDropEvent } from "@/utils/drag";

interface CollectionTileProps extends TileProps {
  collection: ClientCollection;
}

function getTileComponent(
  item: ClientCollection["items"][number],
  isExpanded: boolean,
) {
  const props = {
    id: item.id,
    allowEdit: isExpanded,
  };

  if (item.text) {
    return <TextTile {...props} key={item.id} text={item.text} />;
  }

  if (item.image) {
    return <ImageTile {...props} key={item.id} image={item.image} />;
  }

  if (item.video) {
    return <VideoTile {...props} key={item.id} video={item.video} />;
  }

  if (item.link) {
    return <LinkTile {...props} key={item.id} link={item.link} />;
  }

  if (item.place) {
    return <PlaceTile {...props} key={item.id} place={item.place} />;
  }

  return null;
}

export default function CollectionTile({
  id,
  collection,
  ...props
}: CollectionTileProps) {
  const { items: initialItems } = collection;
  const ref = useRef<StackView>(null);
  const [items, setItems] = useState(initialItems);
  const [isExpanded, setExpanded] = useState(false);

  const onDrop = useCallback(
    async (event: DragDropEvent) => {
      const tileId = event.dragSource.dataset.tileId;
      if (tileId) {
        const newItems = await client.collections.addToCollection.mutate({
          collectionId: collection.id,
          tileId,
        });
        setItems(newItems.items);
      }
    },
    [collection.id],
  );

  const onToggle = useCallback(
    (event: ToggleEvent) => setExpanded(event.newState === "open"),
    [],
  );

  useEffect(() => {
    const element = ref.current;
    if (!element) {
      return;
    }
    element.addEventListener("toggle", onToggle);
    return () => element.removeEventListener("toggle", onToggle);
  }, [onToggle]);

  return (
    <Tile {...props} id={id} showBorder={false} onDrop={onDrop}>
      <stack-view class={styles.stack} ref={ref}>
        {items.map((item, i) => (
          <stack-item
            key={item.id}
            style={
              {
                "--index": i,
                "--angle": i === 0 ? 0 : `${((i * 123) % 20) - 10}deg`,
              } as React.CSSProperties
            }
          >
            {getTileComponent(item, isExpanded)}
          </stack-item>
        ))}
      </stack-view>
    </Tile>
  );
}
