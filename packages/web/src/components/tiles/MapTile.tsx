import Tile from "./Tile";
import MapToolbar from "@/components/toolbars/maps/MapToolbar";
import If from "@/jsx/if";
import Each from "@/jsx/each";
import Portal from "@/jsx/portal";
import styles from "./MapTile.module.css";
import type Map from "@/items/Map";
import type MapEvent from "@/elements/maps/MapEvent";
import type MapView from "@/elements/maps/MapView";
import type MapMarker from "@/elements/maps/MapMarker";
import type { Reactive } from "@/utils/reactivity";

export interface MapTileProps {
  map: Map;
  hasFocus: Reactive<boolean>;
}

export default function MapTile({ map, hasFocus }: MapTileProps) {
  let mapView: MapView | undefined;
  const {
    id,
    places,
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

  const deleteMarker = async ({ markerId }: MapEvent) => {
    if (markerId) {
      map.removePlace(markerId);
    }
  };

  const handleUpdatePlace = async (event: FocusEvent) => {
    const marker = event.target as MapMarker;
    const markerId = marker.id;
    const value = marker.value ?? "";
    // TODO: Only update if the value has changed
    if (markerId) {
      map.updatePlace({ id: markerId, name: value });
    }
  };

  const anchorName = `--map-${id}`;

  return (
    <Tile border="inside" anchorName={anchorName}>
      <If condition={hasFocus}>
        <Portal>
          <MapToolbar
            map={map}
            getMapView={getMapView}
            anchorName={anchorName}
          />
        </Portal>
      </If>

      <pop-out className={styles["pop-out"]}>
        <map-view
          ref={ref}
          className={styles.map}
          movable
          legend
          on:deletemarker={deleteMarker}
        >
          <Each items={places}>
            {(place) => (
              <>
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
                  tabIndex={0}
                  on:blur={handleUpdatePlace}
                />
                <map-legend-item
                  marker={place.id}
                  editable={isEditable}
                  tabIndex={0}
                >
                  {place.name || "Unnamed point"}
                </map-legend-item>
              </>
            )}
          </Each>
        </map-view>
      </pop-out>
    </Tile>
  );
}
