import type { AppRouterOutputs } from "@/api/client";
import client from "@/api/client";
import styles from "./PlaceModal.module.css";
import ModalHeader from "./ModalHeader";
import ModalBody from "./ModalBody";
import ModalFooter from "./ModalFooter";
import Placeholder from "@/components/placeholder/Placeholder";
import { combine, flag, reactive } from "reactivity";
import { handleError } from "@/utils/errors";
import debounce from "@/utils/debounce";
import type { ModalProps } from "@/utils/modals";

type Place = AppRouterOutputs["places"]["search"][number];

/** Idle until there is a query, then pending until the search is done or has failed. */
type SearchStatus = "idle" | "pending" | "done" | "failed";

export type PlaceModalResult = {
  place: Place;
};

interface PlaceModalProps extends ModalProps<PlaceModalResult> {
  boundingBox?: [number, number, number, number];
}

const SEARCH_DELAY = 250;

export default function PlaceModal({ boundingBox, cancel, confirm }: PlaceModalProps) {
  const isPending = flag(false);
  const location = reactive<GeolocationPosition | null>(null);
  const status = reactive<SearchStatus>("idle");
  const results = reactive<Place[]>([]);
  let query = "";
  // Responses to superseded searches are dropped so they cannot replace newer results
  let latestSearch = 0;

  if (!import.meta.env.SSR && !boundingBox) {
    navigator.geolocation.getCurrentPosition(
      (currentLocation) => (location.value = currentLocation),
      (error) => console.error(error),
    );
  }

  async function search() {
    const searchId = ++latestSearch;
    if (!query) {
      results.value = [];
      status.value = "idle";
      return;
    }

    status.value = "pending";
    try {
      const places = await client.places.search.mutate(
        boundingBox
          ? { query, boundingBox }
          : {
              query,
              lat: location.value?.coords.latitude ?? 0,
              long: location.value?.coords.longitude ?? 0,
            },
      );
      if (searchId !== latestSearch) {
        return;
      }
      results.value = places;
      status.value = "done";
    } catch (error) {
      if (searchId !== latestSearch) {
        return;
      }
      console.error(error);
      results.value = [];
      status.value = "failed";
    }
  }

  const debouncedSearch = debounce(search, SEARCH_DELAY);

  function onInput(event: Event) {
    query = (event.currentTarget as HTMLInputElement).value.trim();
    if (query) {
      debouncedSearch();
    } else {
      void search();
    }
  }

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

  const isOpen = status.derive((value) => value !== "idle");
  const isSearching = status.derive((value) => value === "pending");

  // Earlier results stay in view while a search for a new query is pending
  const message = combine({ status, results }, ({ status, results }) => {
    if (results.length > 0) {
      return null;
    }
    switch (status) {
      case "pending":
        return <Placeholder>Searching…</Placeholder>;
      case "done":
        return <Placeholder>No places found.</Placeholder>;
      case "failed":
        return (
          <Placeholder
            actions={
              <button type="button" className="secondary small" on:click={() => void search()}>
                Try again
              </button>
            }
          >
            Place search isn’t available right now.
          </Placeholder>
        );
      default:
        return null;
    }
  });

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

        <div classList={{ [styles.results]: true, [styles.open]: isOpen }} aria-busy={isSearching}>
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
          <div className={styles.status} role="status">
            {message}
          </div>
        </div>
      </ModalBody>

      <ModalFooter>
        <button className="secondary" type="button" on:click={cancel}>
          Cancel
        </button>
      </ModalFooter>
    </>
  );
}
