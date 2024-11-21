import { useCallback, useState } from "react";
import Tile, { type TileProps } from "./Tile";
import Stack from "./collections/Stack";
import client from "@/api/client";
import type { ClientCollection } from "@/types/tiles";
import type { DragDropEvent } from "@/utils/drag";

interface CollectionTileProps extends TileProps {
  collection: ClientCollection;
}

export default function CollectionTile({
  id,
  collection,
  ...props
}: CollectionTileProps) {
  const { items: initialItems, type } = collection;
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

  // const onDelete = useCallback(
  //   async (id: string) => {
  //     await client.collections.removeFromCollection.mutate({
  //       collectionId: collection.id,
  //       id,
  //     });
  //     setItems((items) => items.filter((item) => item.id !== id));
  //   },
  //   [collection.id],
  // );

  switch (type) {
    case "STACK":
      return (
        <Tile {...props} id={id} showBorder={false} onDrop={onDrop}>
          <Stack items={items} />
        </Tile>
      );
  }
}
