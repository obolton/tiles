import maplibregl from "maplibre-gl";
import css from "./MapView.css?inline";
import type MapMarker from "./MapMarker";
import type MapLegendItem from "./MapLegendItem";

const stylesheet = new CSSStyleSheet();
stylesheet.replaceSync(css);

const STYLE_URL = `https://api.maptiler.com/maps/streets-v2/style.json?key=${import.meta.env.PUBLIC_MAPTILER_API_KEY}`;

export interface MapViewAttributes {
  movable?: boolean;
  legend?: boolean;
  ondeletemarker?: (event: import("./MapEvent").default) => void;
}

export default class MapView extends HTMLElement {
  static readonly observedAttributes: (keyof MapViewAttributes)[] = [
    "movable",
    "legend",
  ] as const;

  private root: HTMLElement;
  private intersectionObserver: IntersectionObserver;
  private mutationObserver: MutationObserver;
  private map?: maplibregl.Map;
  private markers: maplibregl.Marker[] = [];
  private legend?: HTMLElement;
  private toolbar?: HTMLElement;

  constructor() {
    super();

    const shadow = this.attachShadow({
      mode: "open",
      slotAssignment: "manual",
    });
    shadow.adoptedStyleSheets = [stylesheet];

    this.root = document.createElement("figure");
    this.root.id = "root";
    shadow.append(this.root);

    this.intersectionObserver = new IntersectionObserver(
      this.intersectionObserverCallback.bind(this),
      { rootMargin: "128px 128px 128px 128px", threshold: 0 },
    );
    this.mutationObserver = new MutationObserver(
      this.mutationObserverCallback.bind(this),
    );
  }

  private getMarkers() {
    return this.querySelectorAll<MapMarker>("map-marker");
  }

  private getLegendItems() {
    return this.querySelectorAll<MapLegendItem>("map-legend-item");
  }

  private getToolbarItems() {
    return this.querySelectorAll<HTMLButtonElement>("button");
  }

  private getBounds() {
    const markers = this.getMarkers();

    if (markers.length === 1) {
      const bounds = markers[0]?.getBounds();
      if (bounds) {
        return new maplibregl.LngLatBounds(bounds);
      } else {
        return undefined;
      }
    }

    const mapBounds = new maplibregl.LngLatBounds();
    markers.forEach((marker) =>
      mapBounds.extend(marker.getBounds() || [marker.long, marker.lat]),
    );
    return mapBounds;
  }

  private addMarker(markerElement: MapMarker) {
    if (!this.map) {
      throw new Error("Map is not initialized");
    }

    const element = document.createElement("div");
    element.classList.add("marker");
    const slot = document.createElement("slot");
    element.appendChild(slot);

    const marker = new maplibregl.Marker({
      element,
      offset: [0, 0],
      subpixelPositioning: true,
    })
      .setLngLat([markerElement.long, markerElement.lat])
      .addTo(this.map);
    this.markers.push(marker);

    slot.assign(markerElement);
  }

  private initializeMap() {
    if (this.map) {
      throw new Error("Map is already initialized");
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

    if (this.hasAttribute("legend")) {
      this.showLegend();
    }

    this.toolbar = document.createElement("div");
    this.toolbar.classList.add("toolbar");
    this.toolbar.append(document.createElement("slot"));
    this.root.appendChild(this.toolbar);

    this.updateSlots();

    requestAnimationFrame(() => this.map?.resize());
  }

  connectedCallback() {
    this.intersectionObserver.observe(this);
    this.mutationObserver.observe(this, { childList: true });
  }

  disconnectedCallback() {
    this.map?.remove();
    this.map = undefined;
    this.intersectionObserver.unobserve(this);
    this.mutationObserver.disconnect();
  }

  attributeChangedCallback(
    name: keyof MapViewAttributes,
    _: string,
    value: string | null,
  ) {
    if (!this.map) {
      return;
    }

    switch (name) {
      case "legend":
        if (value === null) {
          this.hideLegend();
        } else {
          this.showLegend();
        }
        break;
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
    this.updateSlots();
  }

  private updateSlots() {
    this.markers.forEach((marker) => marker.remove());
    this.getMarkers().forEach((marker) => this.addMarker(marker));

    const legendSlot = this.legend?.children[0] as HTMLSlotElement | null;
    legendSlot?.assign(...this.getLegendItems());

    const toolbarSlot = this.toolbar?.children[0] as HTMLSlotElement | null;
    toolbarSlot?.assign(...this.getToolbarItems());
  }

  private showLegend() {
    if (this.legend) {
      return;
    }
    this.legend = document.createElement("div");
    this.legend.classList.add("legend");

    const slot = document.createElement("slot");
    slot.id = "legend-slot";
    this.legend.append(slot);

    this.root.append(this.legend);
  }

  private hideLegend() {
    this.legend?.remove();
    this.legend = undefined;
  }

  flyToMarker(markerId: string) {
    const marker = Array.from(this.getMarkers()).find(
      (marker) => marker.id === markerId,
    );
    if (!marker) {
      return;
    }
    const bounds = marker.getBounds();
    if (bounds) {
      this.map?.fitBounds(bounds, {
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
    marker.focus();
  }

  getBoundingBox(): [number, number, number, number] {
    if (!this.map) {
      throw new Error("Map is not initialized");
    }
    const bounds = this.map.getBounds();
    const sw = bounds.getSouthWest();
    const ne = bounds.getNorthEast();
    return [sw.lng, sw.lat, ne.lng, ne.lat];
  }
}

customElements.define("map-view", MapView);
