import { useCallback, useState } from "react";
import Tile, { type TileProps } from "./Tile";
import ImageTile from "@/components/tiles/ImageTile";
import VideoTile from "@/components/tiles/VideoTile";
import TextTile from "@/components/tiles/TextTile";
import PlaceTile from "@/components/tiles/PlaceTile";
import LinkTile from "@/components/tiles/LinkTile";
import client from "@/api/client";
import styles from "./CollectionTile.module.css";
import type { ClientCollection } from "@/types/tiles";
import type { DragDropEvent } from "@/utils/drag";

interface CollectionTileProps extends TileProps {
  collection: ClientCollection;
}

function getTileComponent(item: ClientCollection["items"][number]) {
  const props = {
    id: item.id,
    allowEdit: false,
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
  const [items, setItems] = useState(initialItems);

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

  return (
    <Tile
      {...props}
      id={id}
      showInLightbox={false}
      showBorder={false}
      onDrop={onDrop}
    >
      <ol className={styles.collection}>
        {items.map((item, i) => (
          <li
            key={item.id}
            style={
              {
                "--angle":
                  i === items.length - 1 ? 0 : `${((i * 123) % 10) - 5}deg`,
              } as React.CSSProperties
            }
          >
            {getTileComponent(item)}
          </li>
        ))}
      </ol>
    </Tile>
  );
}
