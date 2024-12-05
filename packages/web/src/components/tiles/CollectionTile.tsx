import { useCallback, useState } from "react";
import Tile, { type TileProps } from "./Tile";
import Stack from "./collections/Stack";
import client from "@/api/client";
import type { ClientCollection } from "@/types/tiles";
import type { DragDropEvent } from "@/utils/drag";

interface CollectionTileProps extends TileProps, ClientCollection {}

export default function CollectionTile({
  id,
  items: initialItems,
  ...props
}: CollectionTileProps) {
  const [items, setItems] = useState(initialItems);

  // const onDrop = useCallback(
  //   async (event: DragDropEvent) => {
  //     const tileId = event.dragSource.dataset.tileId;
  //     if (tileId) {
  //       const newItems = await client.collections.addToCollection.mutate({
  //         collectionId: id,
  //         tileId,
  //       });
  //       setItems(newItems.items);
  //     }
  //   },
  //   [id],
  // );

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

  return (
    <Tile {...props} id={id} showBorder={false}>
      <Stack items={items} />
    </Tile>
  );
}
