import useEditable from "@/hooks/useEditable";
import Tile, { type TileProps } from "./Tile";
import styles from "./PlaceTile.module.css";
import useCreateCollection from "@/hooks/useCreateCollection";
import type { ClientPlace } from "@/types/tiles";

interface PlaceTileProps extends TileProps {
  place: ClientPlace;
}

export default function PlaceTile({ id, place, ...props }: PlaceTileProps) {
  const { name, lat, long, boundingBox } = place;
  const isEditable = useEditable();
  const onDrop = useCreateCollection(id, "MAP");
  return (
    <Tile {...props} id={id} expandable onDrop={onDrop} origin="center">
      <map-view class={styles.map} movable={!isEditable}>
        <map-view-marker
          lat={lat}
          long={long}
          bounds={boundingBox.length === 4 ? boundingBox.join(",") : undefined}
          label={name}
        />
      </map-view>
    </Tile>
  );
}
