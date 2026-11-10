import Item from "@/components/item/Item";
import TileContent from "@/components/item/TileContent";
import { isReactive, reactive, type Reactive } from "carillon";
import styles from "./EmbeddedTile.module.css";
import type Tile from "@/models/Tile";

export interface EmbeddedTileProps {
  /** The tile, or a reactive that is null until the tile's map has arrived. */
  tile: Tile | Reactive<Tile | null>;
  tabindex?: number;
}

/** A tile embedded in a document body, laid out as one of its blocks. */
export default function EmbeddedTile({ tile, tabindex }: EmbeddedTileProps) {
  const current = isReactive<Tile | null>(tile) ? tile : reactive(tile);
  return (
    <div className={styles.embed}>
      {current.derive((value) =>
        value ? (
          <Item tile={value} tabindex={tabindex} draggable={false}>
            <TileContent tile={value} />
          </Item>
        ) : null,
      )}
    </div>
  );
}
