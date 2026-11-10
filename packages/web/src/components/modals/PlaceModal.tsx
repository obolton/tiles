import type { AppRouterOutputs } from "@/api/client";
import client from "@/api/client";
import styles from "./PlaceModal.module.css";
import ModalHeader from "./ModalHeader";
import ModalBody from "./ModalBody";
import ModalFooter from "./ModalFooter";
import type { ModalProps } from "@/utils/modals";
import { ReactiveValue } from "carillon";
import { handleError } from "@/utils/errors";
import debounce from "@/utils/debounce";

type Place = AppRouterOutputs["places"]["search"][number];

export type PlaceModalResult = {
  place: Place;
};

interface PlaceModalProps extends ModalProps<PlaceModalResult> {
  boundingBox?: [number, number, number, number];
}

export default function PlaceModal({ boundingBox, cancel, confirm }: PlaceModalProps) {
  const isPending = new ReactiveValue(false);
  const location = new ReactiveValue<GeolocationPosition | null>(null);
  const results = new ReactiveValue<Place[]>([]);

  if (!import.meta.env.SSR && !boundingBox) {
    navigator.geolocation.getCurrentPosition(
      (currentLocation) => (location.value = currentLocation),
      (error) => console.error(error),
    );
  }

  const search = debounce(async (query: string) => {
    if (!query) {
      results.value = [];
      return;
    }
    const newResults = await client.places.search.mutate(
      boundingBox
        ? {
            query,
            boundingBox,
          }
        : {
            query,
            lat: location.value?.coords.latitude ?? 0,
            long: location.value?.coords.longitude ?? 0,
          },
    );
    results.value = newResults;
  }, 250);

  const onInput = (event: Event) => {
    const input = event.currentTarget as HTMLInputElement;
    search(input.value);
  };

  const selectPlace = async (place: Place) => {
    if (isPending.value) {
      return;
    }
    isPending.value = true;
    try {
      await confirm({ place });
    } catch (error) {
      handleError(error);
    } finally {
      isPending.value = false;
    }
  };

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
            autofocus
            on:input={onInput}
          />
        </label>

        <ol className={styles["place-select"]} aria-label="Results">
          {results.derive((items) =>
            items.map((result) => (
              <li>
                <button type="button" on:click={() => selectPlace(result)}>
                  <span>{result.name}</span>
                  <span className={styles.description}>{result.address}</span>
                </button>
              </li>
            )),
          )}
        </ol>
      </ModalBody>

      <ModalFooter>
        <button className="secondary" type="button" on:click={cancel}>
          Cancel
        </button>
      </ModalFooter>
    </>
  );
}
