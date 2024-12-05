import type { AppRouterOutputs } from "@/api/client";
import client from "@/api/client";
import useDebouncedCallback from "@/hooks/useDebouncedCallback";
import type { ClientPlace } from "@/types/tiles";
import { createMap, updateTileData } from "@/utils/edit";
import { useCallback, useEffect, useState } from "react";
import styles from "./EditPlaceTileModal.module.css";
import ModalBody from "./ModalBody";
import ModalFooter from "./ModalFooter";
import type { ModalProps } from "@/utils/modals";

type Place = AppRouterOutputs["places"]["search"][number];

interface EditMapTileModalProps extends ModalProps {
  tileId?: string | null;
  tile?: ClientPlace | null;
}

export default function EditMapTileModal({
  tileId,
  close,
}: EditMapTileModalProps) {
  const [location, setLocation] = useState<GeolocationPosition | null>(null);
  const [results, setResults] = useState<Place[]>([]);

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(setLocation, (error) =>
      console.error(error),
    );
  }, []);

  const search = useDebouncedCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const query = event.target.value;
      if (!query) {
        setResults([]);
        return;
      }
      const results = await client.places.search.mutate({
        query,
        lat: location?.coords.latitude ?? 0,
        long: location?.coords.longitude ?? 0,
      });
      setResults(results);
    },
    500,
    [location],
  );

  const selectPlace = useCallback(
    async (place: Place) => {
      if (tileId) {
        const tile = await client.maps.addPlace.mutate({
          id: tileId,
          place,
        });
        updateTileData(tile);
      } else {
        await createMap({ place });
      }

      close();
    },
    [tileId, close],
  );

  return (
    <>
      <ModalBody>
        <label>
          Search for a place
          <input
            className={styles.input}
            name="search"
            type="search"
            placeholder="Address or name"
            autoFocus
            onChange={search}
          />
        </label>

        <ol className={styles["place-select"]}>
          {results.map((result) => (
            <li key={result.providerId} onClick={() => selectPlace(result)}>
              <div>{result.name}</div>
              <div className={styles.description}>{result.address}</div>
            </li>
          ))}
        </ol>
      </ModalBody>

      <ModalFooter>
        <button className="secondary" type="button" onClick={close}>
          Cancel
        </button>
      </ModalFooter>
    </>
  );
}
