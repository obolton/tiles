import { Fragment, useCallback } from "react";
import client from "@/api/client";
import useEditable from "@/hooks/useEditable";
import Tile, { type TileProps } from "./Tile";
import addPlaceIcon from "@/icons/add-place.svg";
import styles from "./MapTile.module.css";
import type { ClientPlace, ClientMapTile } from "@/types/tiles";
import type MapEvent from "@/components/maps/MapEvent";
import { showModal } from "@/utils/modals";
import { updateTileState } from "@/utils/edit";
import type MapMarker from "../maps/MapMarker";

interface MapTileProps extends TileProps {
  places: ClientPlace[];
}

export default function MapTile({ id, places, ...props }: MapTileProps) {
  const isEditable = useEditable();
  const addPlace = useCallback(
    async () => showModal("MAP", { tileId: id }),
    [id],
  );

  // TODO: This doesn't work properly when wrapped in useCallback
  const deleteMarker = async ({ markerId }: MapEvent) => {
    if (markerId) {
      const tile = await client.maps.removePlace.mutate({
        placeId: markerId,
        id,
      });

      updateTileState(tile);
    }
  };

  // TODO: This doesn't work properly when wrapped in useCallback
  const updatePlace = async (event: FocusEvent) => {
    const marker = event.target as MapMarker;
    const markerId = marker.id;
    const value = marker.value ?? "";
    if (markerId) {
      await client.maps.updatePlace.mutate({
        id: markerId,
        name: value,
      });

      updateTileState({
        id,
        places: places.map((place) =>
          place.id === markerId ? { ...place, name: value } : place,
        ),
      } as ClientMapTile);
    }
  };

  return (
    <pop-out class={styles["pop-out"]} expandable="expandable" tabindex="0">
      <Tile border="inside">
        <map-view
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
                onblur={updatePlace}
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
              className="floating tooltip-right"
              aria-label="Add a place"
              onPointerDownCapture={(event) => {
                event.stopPropagation();
                event.preventDefault();
              }}
              onClick={addPlace}
            >
              <img src={addPlaceIcon.src} alt="Add a place" />
            </button>
          ) : null}
        </map-view>
      </Tile>
    </pop-out>
  );
}
