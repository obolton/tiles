import { Fragment, useCallback } from "react";
import client from "@/api/client";
import useEditable from "@/hooks/useEditable";
import Tile, { type TileProps } from "./Tile";
import addPlaceIcon from "@/icons/add-place.svg";
import styles from "./MapTile.module.css";
import type { ClientPlace } from "@/types/tiles";
import type MapEvent from "@/components/maps/MapEvent";
import { showModal } from "@/utils/modals";
import { updateTileState } from "@/utils/edit";

interface MapTileProps extends TileProps {
  places: ClientPlace[];
}

export default function MapTile({ id, places, ...props }: MapTileProps) {
  const isEditable = useEditable();
  const addPlace = useCallback(
    async () => showModal("MAP", { tileId: id }),
    [id],
  );

  const deleteMarker = useCallback(
    async ({ markerId }: MapEvent) => {
      if (markerId) {
        const tile = await client.maps.removePlace.mutate({
          placeId: markerId,
          id,
        });

        updateTileState(tile);
      }
    },
    [id],
  );

  return (
    <pop-out class={styles["pop-out"]} expandable="expandable" tabindex="0">
      <Tile {...props} id={id}>
        <map-view class={styles.map} movable legend={places.length > 1}>
          {places.map((place) => (
            <Fragment key={place.id}>
              <map-marker
                id={place.id}
                lat={place.lat}
                long={place.long}
                bounds={
                  place.boundingBox.length === 4
                    ? place.boundingBox.join(",")
                    : undefined
                }
                label={place.name}
              />
              <map-legend-item
                slot="legend"
                marker={place.id}
                delete={isEditable}
                ondeletemarker={deleteMarker}
              >
                {place.name}
              </map-legend-item>
            </Fragment>
          ))}
          {isEditable ? (
            <button
              type="button"
              className="floating tooltip-right"
              aria-label="Add a place"
              slot="toolbar"
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
