import useEditable from "@/hooks/useEditable";
import Tile, { type TileProps } from "./Tile";
import styles from "./PlaceTile.module.css";
import type { ClientPlace } from "@/types/tiles";

interface PlaceTileProps extends TileProps {
  place: ClientPlace;
}

export default function PlaceTile({ place, ...props }: PlaceTileProps) {
  const { name, lat, long, boundingBox } = place;
  const isEditable = useEditable();
  return (
    <Tile {...props} fullWidth>
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
