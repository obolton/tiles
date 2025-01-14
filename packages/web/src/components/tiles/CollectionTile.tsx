import Tile from "./Tile";
import Stack from "./collections/Stack";
import Carousel from "./collections/Carousel";
import type { ClientCollectionTile } from "@/types/tiles";

export default function CollectionTile({
  id,
  columns,
  items,
}: ClientCollectionTile) {
  return (
    <Tile background={false} border={columns === 1 ? "none" : "inside"}>
      {columns === 1 ? (
        <Stack id={id} items={items} />
      ) : (
        <Carousel id={id} items={items} />
      )}
    </Tile>
  );
}
