import Tile from "./Tile";
import AddPlaceIcon from "@/icons/add-place.svg?jsx";
import styles from "./MapTile.module.css";
import { showModal } from "@/utils/modals";
import type MapEvent from "@/elements/maps/MapEvent";
import type MapView from "@/elements/maps/MapView";
import type MapMarker from "@/elements/maps/MapMarker";
import type { PlaceModalResult } from "@/components/modals/PlaceModal";
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

  const handleAddPlace = () =>
    showModal<PlaceModalResult>("MAP", {
      boundingBox: mapView?.getBoundingBox(),
      async onConfirm({ place }) {
        const result = await editor.addPlaces({ id, places: [place] });
        places.value = result.places;
      },
    });

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

  return (
    <Tile border="inside">
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

        {hasFocus.derive((value) =>
          value ? (
            <floating-toolbar
              data-tooltip-position="top"
              aria-label="Map toolbar"
            >
              <button
                role="menuitem"
                type="button"
                className="floating"
                aria-label="Add place"
                data-tooltip="Add a place"
                onclick={handleAddPlace}
              >
                <AddPlaceIcon aria-hidden="true" />
              </button>
            </floating-toolbar>
          ) : null,
        )}
      </pop-out>
    </Tile>
  );
}
