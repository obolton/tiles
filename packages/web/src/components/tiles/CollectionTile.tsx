import Stack from "@/components/layouts/stack/Stack";
import Carousel from "@/components/layouts/carousel/Carousel";
import Placeholder from "@/components/placeholder/Placeholder";
import styles from "./CollectionTile.module.css";
import type { CollectionProperties } from "@/types/tiles";
import type Editor from "@/editor/Editor";

function CollectionTilePlaceholder() {
  return <Placeholder className={styles.placeholder}>Empty</Placeholder>;
}

interface CollectionTileProps extends CollectionProperties {
  editor: Editor;
}

export default function CollectionTile({
  editor,
  id,
  columns,
  rows,
  tiles,
}: CollectionTileProps) {
  if (columns.value <= 2 && rows.value <= 2) {
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
