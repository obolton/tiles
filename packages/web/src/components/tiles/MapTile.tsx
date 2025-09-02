import Tile from "./Tile";
import MapToolbar from "@/components/toolbars/maps/MapToolbar";
import styles from "./MapTile.module.css";
import type MapEvent from "@/elements/maps/MapEvent";
import type MapView from "@/elements/maps/MapView";
import type MapMarker from "@/elements/maps/MapMarker";
import type Editor from "@/editor/Editor";
import type { Reactive } from "@/utils/reactivity";
import type { MapProperties } from "@/types/tiles";

export interface MapTileProps extends MapProperties {
  editor: Editor;
  hasFocus: Reactive<boolean>;
}

export default function MapTile({
  editor,
  id,
  places,
  hasFocus,
}: MapTileProps) {
  let mapView: MapView | undefined;
  const { isEditable } = editor;

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
      const result = await editor.removePlace({
        id,
        placeId: markerId,
      });
      places.value = result.places;
    }
  };

  const handleUpdatePlace = async (event: FocusEvent) => {
    const marker = event.target as MapMarker;
    const markerId = marker.id;
    const value = marker.value ?? "";
    // TODO: Only update if the value has changed
    if (markerId) {
      const result = await editor.updatePlace({
        id,
        place: {
          id: markerId,
          name: value,
        },
      });
      places.value = result.places;
    }
  };

  const anchorName = `--map-${id}`;

  return (
    <Tile border="inside" anchorName={anchorName}>
      {hasFocus.derive((value) =>
        value ? (
          <MapToolbar
            id={id}
            editor={editor}
            places={places}
            getMapView={getMapView}
            anchorName={anchorName}
          />
        ) : null,
      )}

      <pop-out className={styles["pop-out"]}>
        <map-view
          ref={ref}
          className={styles.map}
          movable
          legend
          on:deletemarker={deleteMarker}
        >
          {places.derive((items) =>
            items.map((place) => (
              <>
                <map-marker
                  editable={isEditable}
                  id={place.id}
                  lat={place.lat}
                  long={place.long}
                  bounds={
                    place.boundingBox.length === 4
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
            )),
          )}
        </map-view>
      </pop-out>
    </Tile>
  );
}
