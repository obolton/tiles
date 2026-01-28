import Tile from "./Tile";
import MapToolbar from "@/components/toolbars/maps/MapToolbar";
import If from "@/jsx/if";
import Each from "@/jsx/each";
import Portal from "@/jsx/portal";
import { reactive } from "@/utils/reactivity";
import styles from "./MapTile.module.css";
import type Map from "@/models/Map";
import type MapView from "@/elements/maps/MapView";
import type MapMarker from "@/elements/maps/MapMarker";
import type { Reactive } from "@/utils/reactivity";

export interface MapTileProps {
  map: Map;
  showToolbar: Reactive<boolean>;
}

export default function MapTile({ map, showToolbar }: MapTileProps) {
  let mapView: MapView | undefined;
  const hasSelection = reactive(false);
  const {
    places,
    animation,
    frame,
    editor: { isEditable },
  } = map;

  const ref = (element: MapView) => {
    mapView = element;
  };

  function getMapView() {
    if (!mapView) {
      throw new Error("Map is not initialized");
    }
    return mapView;
  }

  const handleLabelChange = async (event: Event) => {
    const marker = event.target as MapMarker;
    const markerId = marker.id;
    const value = marker.value ?? "";
    if (markerId) {
      map.updatePlace({ id: markerId, name: value });
    }
  };

  const handleSelectionChange = () => {
    hasSelection.value = getMapView().selectedMarkerIds.size > 0;
  };

  return (
    <Tile animation={animation} frame={frame}>
      <If condition={showToolbar}>
        <Portal>
          <MapToolbar
            map={map}
            getMapView={getMapView}
            hasSelection={hasSelection}
          />
        </Portal>
      </If>

      <pop-out className={styles["pop-out"]}>
        <map-view
          ref={ref}
          className={styles.map}
          movable
          legend
          mapstyle={map.style}
          on:mapselectionchange={handleSelectionChange}
        >
          <Each items={places}>
            {(place) => (
              <map-marker
                editable={isEditable}
                id={place.id}
                lat={place.lat}
                long={place.long}
                bounds={
                  place.boundingBox?.length === 4
                    ? place.boundingBox.join(",")
                    : undefined
                }
                label={place.name}
                tabindex={0}
                on:change={handleLabelChange}
              />
            )}
          </Each>
        </map-view>
      </pop-out>
    </Tile>
  );
}
