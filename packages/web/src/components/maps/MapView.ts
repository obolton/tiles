import maplibregl from "maplibre-gl";
import stylesheet from "./MapView.css?url";

const STYLE_URL = `https://api.maptiler.com/maps/streets-v2/style.json?key=${import.meta.env.PUBLIC_MAPTILER_API_KEY}`;

type Marker = {
  id: string;
  lat: number;
  long: number;
  bounds: [number, number, number, number] | null;
  label: string | null;
};

function parseBounds(value: string): [number, number, number, number] | null {
  if (!value) {
    return null;
  }

  const values = value.split(",", 4);
  if (values.length !== 4) {
    throw new Error("Invalid bounding box");
  }

  return values.map(parseFloat) as [number, number, number, number];
}

export default class MapView extends HTMLElement {
  static observedAttributes = ["movable", "legend"] as const;

  private root: HTMLElement;
  private intersectionObserver: IntersectionObserver;
  private mutationObserver: MutationObserver;
  private map?: maplibregl.Map;
  private labelElement?: HTMLDivElement;
  private markers: maplibregl.Marker[] = [];
  private legend?: HTMLElement;

  constructor() {
    super();

    const shadow = this.attachShadow({ mode: "closed" });
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = stylesheet;
    this.root = document.createElement("figure");
    this.root.id = "root";
    shadow.append(link, this.root);

    this.intersectionObserver = new IntersectionObserver(
      this.intersectionObserverCallback.bind(this),
      { rootMargin: "128px 128px 128px 128px", threshold: 0 },
    );
    this.mutationObserver = new MutationObserver(
      this.mutationObserverCallback.bind(this),
    );
  }

  private getMarkers() {
    const markers: Marker[] = [];
    for (const marker of this.querySelectorAll("map-view-marker")) {
      const lat = marker.getAttribute("lat") ?? "0";
      const long = marker.getAttribute("long") ?? "0";
      const bounds = marker.getAttribute("bounds") ?? "";
      markers.push({
        id: marker.getAttribute("id") ?? "",
        lat: parseFloat(lat),
        long: parseFloat(long),
        bounds: parseBounds(bounds),
        label: marker.getAttribute("label"),
      });
    }
    return markers;
  }

  private getBounds() {
    const markers = this.getMarkers();

    if (markers.length === 1) {
      if (markers[0]?.bounds) {
        return new maplibregl.LngLatBounds(markers[0].bounds);
      } else {
        return undefined;
      }
    }

    const mapBounds = new maplibregl.LngLatBounds();
    markers.forEach(({ bounds, lat, long }) =>
      mapBounds.extend(bounds || [long, lat]),
    );
    return mapBounds;
  }

  private addMarker({ lat, long, label }: Marker) {
    if (!this.map) {
      throw new Error("Map is not initialized");
    }

    const marker = new maplibregl.Marker({
      color: `var(--marker-color)`,
      subpixelPositioning: true,
    })
      .setLngLat([long, lat])
      .addTo(this.map);
    this.markers.push(marker);

    if (label) {
      this.labelElement = document.createElement("div");
      this.labelElement.classList.add("marker");
      this.labelElement.textContent = label;
      const labelMarker = new maplibregl.Marker({
        element: this.labelElement,
        offset: [0, -60],
        subpixelPositioning: true,
      })
        .setLngLat([long, lat])
        .addTo(this.map);
      this.markers.push(labelMarker);
    }
  }

  private initializeMap() {
    if (this.map) {
      throw new Error("Map is already initialized");
    }

    const movable = this.getAttribute("movable");

    if (movable === "false") {
      this.root.classList.add("static");
    } else {
      this.root.classList.remove("static");
    }

    const markers = this.getMarkers();

    this.map = new maplibregl.Map({
      container: this.root,
      style: STYLE_URL,
      center:
        markers.length === 1 ? [markers[0]!.long, markers[0]!.lat] : undefined,
      bounds: this.getBounds(),
      zoom: 13,
      attributionControl: { compact: true },
      fitBoundsOptions: { padding: 64 },
    });
    this.map.addControl(new maplibregl.NavigationControl(), "bottom-right");

    this.updateMarkers();

    if (this.getAttribute("legend")) {
      this.showLegend();
    }

    requestAnimationFrame(() => this.map?.resize());
  }

  connectedCallback() {
    this.intersectionObserver.observe(this);
    this.mutationObserver.observe(this, { childList: true });
  }

  disconnectedCallback() {
    this.map?.remove();
    this.map = undefined;
    this.labelElement = undefined;
    this.intersectionObserver.unobserve(this);
    this.mutationObserver.disconnect();
  }

  attributeChangedCallback(
    name: (typeof MapView.observedAttributes)[number],
    _: string,
    value: string,
  ) {
    if (!this.map) {
      return;
    }

    switch (name) {
      case "movable":
        if (value === "false") {
          this.root.classList.add("static");
        } else {
          this.root.classList.remove("static");
        }
        break;

      case "legend":
        if (value) {
          this.showLegend();
        } else {
          this.hideLegend();
        }
    }
  }

  intersectionObserverCallback(entries: IntersectionObserverEntry[]) {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        this.initializeMap();
        this.intersectionObserver.unobserve(this);
        return;
      }
    }
  }

  mutationObserverCallback() {
    this.markers.forEach((marker) => marker.remove());
    this.updateMarkers();
  }

  updateMarkers() {
    this.getMarkers().forEach((marker) => this.addMarker(marker));
  }

  private showLegend() {
    if (this.legend) {
      return;
    }
    this.legend = document.createElement("div");
    this.legend.classList.add("legend");

    const slot = document.createElement("slot");
    slot.name = "legend";
    this.legend.append(slot);
    this.root.append(this.legend);
  }

  private hideLegend() {
    this.legend?.remove();
    this.legend = undefined;
  }

  flyToMarker(markerId: string) {
    const marker = this.getMarkers().find((marker) => marker.id === markerId);
    if (!marker) {
      return;
    }
    if (marker.bounds) {
      this.map?.fitBounds(marker.bounds, {
        padding: 64,
        animate: true,
        duration: 500,
      });
    } else {
      this.map?.flyTo({
        center: [marker.long, marker.lat],
        zoom: 13,
        duration: 500,
      });
    }
  }
}
