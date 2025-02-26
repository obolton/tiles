import Stack from "@/components/layouts/stack/Stack";
import Carousel from "@/components/layouts/carousel/Carousel";
import Placeholder from "@/components/placeholder/Placeholder";
import TileButtons from "@/components/menu/TileButtons";
import useEditable from "@/hooks/useEditable";
import type { Tile } from "@/types/layout";

function CollectionTilePlaceholder({ collectionId }: { collectionId: string }) {
  const isEditable = useEditable();
  return (
    <Placeholder
      actions={
        isEditable ? (
          <TileButtons collectionId={collectionId} exclude={["SECTION"]} />
        ) : undefined
      }
    >
      There’s nothing here.
    </Placeholder>
  );
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
