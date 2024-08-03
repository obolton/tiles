import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import mapboxgl from "mapbox-gl";
import MapboxGeocoder from "@mapbox/mapbox-gl-geocoder";
import ModalHeader from "./ModalHeader";
import ModalFooter from "./ModalFooter";
import { createTile, updateTile } from "@/utils/edit";
import styles from "./EditPlaceTileModal.module.css";
import "mapbox-gl/dist/mapbox-gl.css";
import "@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css";
import type { Result } from "@mapbox/mapbox-gl-geocoder";
import type { ClientPlaceTile } from "@/types/tiles";

mapboxgl.accessToken = import.meta.env.PUBLIC_MAPBOX_ACCESS_TOKEN;

type Place = ClientPlaceTile["place"];

interface EditPlaceTileModalProps {
  pageId: string;
  close: () => void;
  tile?: ClientPlaceTile | null;
}

export default function EditPlaceTileModal({
  pageId,
  close,
  tile,
}: EditPlaceTileModalProps) {
  const mapRef = useRef<mapboxgl.Map>();
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [place, setPlace] = useState<Place | null>(null);

  useLayoutEffect(() => {
    const container = mapContainerRef.current;
    if (!container) {
      return;
    }

    // Prevent Mapbox from getting a scaled container width and height
    Object.defineProperty(container, "getBoundingClientRect", {
      value: () => ({ width: 520, height: 400 }),
    });

    // Initialize map
    const { long, lat, boundingBox } = tile?.place || {};
    const map = new mapboxgl.Map({
      container,
      style: "mapbox://styles/mapbox/streets-v12",
      center:
        typeof long == "number" && typeof lat == "number"
          ? [long, lat]
          : undefined,
      bounds:
        boundingBox && boundingBox.length > 0
          ? (boundingBox as [number, number, number, number])
          : undefined,
      zoom: 14,
      logoPosition: "bottom-left",
    });
    mapRef.current = map;

    // Add geocoder component
    const geocoder = new MapboxGeocoder({
      accessToken: mapboxgl.accessToken,
      mapboxgl: mapboxgl,
      flyTo: {
        animate: false,
      },
    });
    geocoder.on("result", ({ result }: { result: Result }) =>
      setPlace({
        providerId:
          typeof result.id === "number"
            ? result.id.toString()
            : result.id || null,
        name: result.text,
        long: result.center[0],
        lat: result.center[1],
        boundingBox: result.bbox ?? null,
        address: result.properties?.address ?? null,
      }),
    );
    map.addControl(geocoder);

    // Add marker
    if (tile) {
      geocoder.setInput(tile.place.name);
      new mapboxgl.Marker({
        color: "#555555",
        draggable: true,
      })
        .setLngLat([tile.place.long, tile.place.lat])
        .addTo(map);
    }

    return () => {
      mapRef.current?.remove();
    };
  }, []);

  useEffect(() => {
    if (!tile) {
      navigator.geolocation.getCurrentPosition(
        (location) => {
          mapRef.current?.setCenter([
            location.coords.longitude,
            location.coords.latitude,
          ]);
        },
        (error) => {
          console.error(error);
        },
      );
    }
  }, [tile]);

  const submit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      if (!place) {
        return;
      }

      if (tile) {
        await updateTile({
          id: tile.id,
          type: "PLACE",
          place,
        });
      } else {
        await createTile({
          pageId,
          type: "PLACE",
          place,
        });
      }

      close();
    },
    [pageId, place, tile, close],
  );

  return (
    <form onSubmit={submit}>
      <ModalHeader>Place</ModalHeader>

      <section className={styles.map} ref={mapContainerRef} />

      <ModalFooter>
        <button className="primary" type="submit" aria-disabled={!place}>
          Save
        </button>
        <button className="secondary" type="button" onClick={close}>
          Cancel
        </button>
      </ModalFooter>
    </form>
  );
}
