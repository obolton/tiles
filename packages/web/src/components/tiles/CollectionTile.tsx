import Stack from "@/components/layouts/stack/Stack";
import Carousel from "@/components/layouts/carousel/Carousel";
import Placeholder from "@/components/placeholder/Placeholder";
import type { Tile } from "@/types/layout";

function CollectionTilePlaceholder() {
  return <Placeholder>Empty</Placeholder>;
}

type CollectionTileProps = Extract<Tile, { type: "COLLECTION" }>;

export default function CollectionTile({
  id,
  columns,
  tiles,
}: CollectionTileProps) {
  if (columns === 1) {
    return (
      <Stack
        collectionId={id}
        items={tiles}
        Placeholder={CollectionTilePlaceholder}
      />
    );
  } else {
    return (
      <Carousel
        collectionId={id}
        items={tiles}
        Placeholder={CollectionTilePlaceholder}
      />
    );
  }
}
