import { Fragment, useCallback, useEffect, useRef } from "react";
import client from "@/api/client";
import useEditable from "@/hooks/useEditable";
import Tile, { type TileProps } from "./Tile";
import addPlaceIcon from "@/icons/add-place.svg";
import styles from "./MapTile.module.css";
import type { ClientMap } from "@/types/tiles";
import type MapView from "@/components/maps/MapView";
import type MapEvent from "@/components/maps/MapEvent";
import { showModal } from "@/utils/modals";
import { updateTileData } from "@/utils/edit";

interface MapTileProps extends TileProps {
  map: ClientMap;
}

export default function MapTile({ id, map, ...props }: MapTileProps) {
  const { places } = map;
  const isEditable = useEditable();
  const ref = useRef<MapView>(null);
  const addPlace = useCallback(
    async () => showModal("MAP", { tileId: id }),
    [id],
  );

  const handleDelete = useCallback(
    async ({ markerId }: MapEvent) => {
      if (markerId) {
        const tile = await client.maps.removePlace.mutate({
          placeId: markerId,
          id,
        });
        if (tile.map?.places) {
          updateTileData({ ...tile, type: "MAP", map: tile.map! });
        }
      }
    },
    [id],
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
    <pop-out class={styles["pop-out"]} expandable="expandable" tabindex="0">
      <Tile {...props} id={id}>
        <map-view
          class={styles.map}
          movable
          legend={places.length > 1 ? "legend" : undefined}
          ref={ref}
        >
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
              >
                {place.name}
              </map-legend-item>
            </Fragment>
          ))}
          {isEditable ? (
            <button
              type="button"
              className="floating tooltip tooltip-right"
              aria-label="Add a place"
              slot="toolbar"
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
