import type { AppRouterOutputs } from "@/api/client";
import client from "@/api/client";
import useDebouncedCallback from "@/hooks/useDebouncedCallback";
import { useCallback, useEffect, useState, useTransition } from "react";
import styles from "./PlaceModal.module.css";
import ModalHeader from "./ModalHeader";
import ModalBody from "./ModalBody";
import ModalFooter from "./ModalFooter";
import type { ModalProps } from "@/utils/modals";

type Place = AppRouterOutputs["places"]["search"][number];

export type PlaceModalResult = {
  place: Place;
};

interface PlaceModalProps extends ModalProps<PlaceModalResult> {
  boundingBox?: [number, number, number, number];
}

export default function PlaceModal({
  boundingBox,
  cancel,
  confirm,
}: PlaceModalProps) {
  const [isPending, startTransition] = useTransition();
  const [location, setLocation] = useState<GeolocationPosition | null>(null);
  const [results, setResults] = useState<Place[]>([]);

  useEffect(() => {
    if (!boundingBox) {
      navigator.geolocation.getCurrentPosition(setLocation, (error) =>
        console.error(error),
      );
    }
  }, [boundingBox]);

  const search = useDebouncedCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const query = event.target.value;
      if (!query) {
        setResults([]);
        return;
      }
      const results = await client.places.search.mutate(
        boundingBox
          ? {
              query,
              boundingBox,
            }
          : {
              query,
              lat: location?.coords.latitude ?? 0,
              long: location?.coords.longitude ?? 0,
            },
      );
      setResults(results);
    },
    300,
    [location],
  );

  const selectPlace = useCallback(
    (place: Place) => {
      if (isPending) {
        return;
      }
      startTransition(() => confirm({ place }));
    },
    [isPending, confirm],
  );

  return (
    <>
      <ModalHeader>
        <h2>Place</h2>
      </ModalHeader>

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
        <button className="secondary" type="button" onClick={cancel}>
          Cancel
        </button>
      </ModalFooter>
    </>
  );
}
