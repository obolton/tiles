import { Fragment, useCallback, useRef } from "react";
import useEditable from "@/hooks/useEditable";
import Tile from "./Tile";
import addPlaceIcon from "@/icons/add-place.svg";
import styles from "./MapTile.module.css";
import type { ClientMapTile } from "@/types/tiles";
import type MapEvent from "@/elements/maps/MapEvent";
import { showModal } from "@/utils/modals";
import { useEditor } from "@/context/editor";
import type MapView from "@/elements/maps/MapView";
import type MapMarker from "@/elements/maps/MapMarker";
import type { PlaceModalResult } from "@/components/modals/PlaceModal";

type MapTileProps = ClientMapTile;

export default function MapTile({ id, places }: MapTileProps) {
  const ref = useRef<MapView>(null);
  const editor = useEditor();
  const isEditable = useEditable();
  const handleAddPlace = useCallback(
    () =>
      showModal<PlaceModalResult>("MAP", {
        boundingBox: ref.current?.getBoundingBox(),
        async onConfirm({ place }) {
          await editor.addPlace({ id, place });
        },
      }),
    [editor, id],
  );

  // TODO: This doesn't work properly when wrapped in useCallback
  const deleteMarker = async ({ markerId }: MapEvent) => {
    if (markerId) {
      await editor.removePlace({
        id,
        placeId: markerId,
      });
    }
  };

  // TODO: This doesn't work properly when wrapped in useCallback
  const handleUpdatePlace = async (event: FocusEvent) => {
    const marker = event.target as MapMarker;
    const markerId = marker.id;
    const value = marker.value ?? "";
    // TODO: Only update if the value has changed
    if (markerId) {
      await editor.updatePlace({
        id,
        placeId: markerId,
        name: value,
      });
    }
  };

  return (
    <pop-out class={styles["pop-out"]} expandable="expandable" tabindex="0">
      <Tile border="inside">
        <map-view
          ref={ref}
          class={styles.map}
          movable
          legend
          ondeletemarker={deleteMarker}
        >
          {places.map((place) => (
            <Fragment key={place.id}>
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
                tabindex="0"
                onblur={handleUpdatePlace}
              />
              <map-legend-item
                marker={place.id}
                editable={isEditable && places.length > 1}
                tabindex="0"
              >
                {place.name || "Unnamed point"}
              </map-legend-item>
            </Fragment>
          ))}
          {isEditable ? (
            <button
              type="button"
              className="floating"
              aria-label="Add place"
              data-tooltip="Add a place"
              onPointerDownCapture={(event) => {
                event.stopPropagation();
                event.preventDefault();
              }}
              onClick={handleAddPlace}
            >
              <img src={addPlaceIcon.src} alt="Add a place" />
            </button>
          ) : null}
        </map-view>
      </Tile>
    </pop-out>
  );
}
