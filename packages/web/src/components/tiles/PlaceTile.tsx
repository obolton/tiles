import useEditable from "@/hooks/useEditable";
import Tile from "./Tile";
import styles from "./PlaceTile.module.css";
import type { ClientPlaceTile } from "@/types/tiles";

type PlaceTileProps = {
  tile: ClientPlaceTile;
};

export default function PlaceTile({ tile }: PlaceTileProps) {
  const {
    place: { name, lat, long, boundingBox },
  } = tile;
  const isEditable = useEditable();
  return (
    <Tile tile={tile}>
      <map-view
        class={styles.map}
        movable={!isEditable}
        lat={lat}
        long={long}
        bounds={boundingBox.length === 4 ? boundingBox.join(",") : undefined}
        label={name}
      ></map-view>
    </Tile>
  );
}
