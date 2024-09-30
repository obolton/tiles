import styles from "./Map.module.css";
import type { ClientCollection } from "@/types/tiles";

interface MapProps {
  items: ClientCollection["items"];
}

export default function Map({ items }: MapProps) {
  return (
    <map-view class={styles.map} movable>
      {items.map((item) =>
        item.place ? (
          <map-view-marker
            key={item.id}
            lat={item.place.lat}
            long={item.place.long}
            bounds={
              item.place.boundingBox.length === 4
                ? item.place.boundingBox.join(",")
                : undefined
            }
            label={item.place.name}
          />
        ) : null,
      )}
    </map-view>
  );
}
