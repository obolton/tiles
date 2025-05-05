import Stack from "@/components/layouts/stack/Stack";
import Carousel from "@/components/layouts/carousel/Carousel";
import Placeholder from "@/components/placeholder/Placeholder";
import styles from "./CollectionTile.module.css";
import type { Tile } from "@/types/layout";
import type Editor from "@/editor/Editor";

function CollectionTilePlaceholder() {
  return <Placeholder className={styles.placeholder}>Empty</Placeholder>;
}

interface CollectionTileProps extends Extract<Tile, { type: "COLLECTION" }> {
  editor: Editor;
}

export default function CollectionTile({
  editor,
  id,
  columns,
  rows,
  tiles,
}: CollectionTileProps) {
  if (columns <= 2 && rows <= 2) {
    return (
      <Stack
        editor={editor}
        collectionId={id}
        items={tiles}
        Placeholder={CollectionTilePlaceholder}
      />
    );
  } else {
    return (
      <Carousel
        editor={editor}
        collectionId={id}
        items={tiles}
        Placeholder={CollectionTilePlaceholder}
      />
    );
  }
}
