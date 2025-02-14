import Stack from "@/components/layouts/stack/Stack";
import Carousel from "@/components/layouts/carousel/Carousel";
import type { ClientCollectionTile } from "@/types/tiles";

export default function CollectionTile({
  id,
  columns,
  items,
}: ClientCollectionTile) {
  if (columns === 1) {
    return <Stack id={id} items={items} />;
  } else {
    return <Carousel id={id} items={items} />;
  }
}
