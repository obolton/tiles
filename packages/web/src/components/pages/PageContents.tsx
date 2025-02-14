import Grid from "@/components/layouts/grid/Grid";
import Placeholder from "@/components/placeholder/Placeholder";
import TileButtons from "@/components/menu/TileButtons";
import useEditable from "@/hooks/useEditable";
import styles from "./PageContents.module.css";
import type { ClientTile } from "@/types/tiles";

interface PageContentsProps {
  items: ClientTile[];
}

export default function PageContents({ items }: PageContentsProps) {
  const isEditable = useEditable();

  if (items.length === 0) {
    return (
      <Placeholder actions={isEditable ? <TileButtons /> : undefined}>
        {isEditable
          ? "There’s nothing here yet. Get starting by adding some content."
          : "This page is empty."}
      </Placeholder>
    );
  }
  return <Grid className={styles.grid} items={items} />;
}
