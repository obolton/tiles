import { useCallback, useRef, useEffect } from "react";
import styles from "./Map.module.css";
import useEditable from "@/hooks/useEditable";
import type MapView from "@/components/maps/MapView";
import type MapEvent from "@/components/maps/MapEvent";
import type { ClientCollection } from "@/types/tiles";

interface MapProps {
  items: ClientCollection["items"];
  onDelete: (id: string) => void;
}

export default function Map({ items, onDelete }: MapProps) {
  const isEditable = useEditable();
  const ref = useRef<MapView>(null);

  const handleDelete = useCallback(
    ({ markerId }: MapEvent) => {
      if (markerId) {
        onDelete(markerId);
      }
    },
    [onDelete],
  );

  useEffect(() => {
    const element = ref.current;
    if (!element) {
      return;
    }
    element.addEventListener("delete-marker", handleDelete);
    return () => element.removeEventListener("delete-marker", handleDelete);
  }, [handleDelete]);

  return (
    <map-view ref={ref} class={styles.map} movable legend>
      {items.map((item) =>
        item.place ? (
          <>
            <map-view-marker
              id={item.id}
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
            <map-legend-item slot="legend" marker={item.id} delete={isEditable}>
              {item.place.name}
            </map-legend-item>
          </>
        ) : null,
      )}
    </map-view>
  );
}
