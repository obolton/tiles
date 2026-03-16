import maplibregl from "maplibre-gl";
import MapEvent from "./MapEvent";
import css from "./MapView.css?inline";
import type MapMarker from "./MapMarker";
import type { GlobalHTMLAttributes } from "@/jsx/html-attributes";

const stylesheet = new CSSStyleSheet();
stylesheet.replaceSync(css);

type MapStyleType = "DEFAULT" | "SATELLITE" | "WATERCOLOR" | "MONOCHROME";

const MAP_STYLE_NAMES: Record<MapStyleType, string> = {
  DEFAULT: "streets-v4",
  SATELLITE: "satellite",
  WATERCOLOR: "aquarelle",
  MONOCHROME: "toner-v2",
};

function getStyleUrl(style: MapStyleType = "DEFAULT") {
  const slug = MAP_STYLE_NAMES[style] ?? MAP_STYLE_NAMES.DEFAULT;
  return `https://api.maptiler.com/maps/${slug}/style.json?key=${import.meta.env.PUBLIC_MAPTILER_API_KEY}`;
}

export interface MapViewAttributes extends GlobalHTMLAttributes {
  movable?: boolean;
  legend?: boolean;
  mapstyle?: MapStyleType | null;
}

declare global {
  interface HTMLElementTagNameMap {
    "map-view": MapView;
  }
}

declare module "@/jsx/html-attributes" {
  interface HTMLAttributesByTagName {
    "map-view": MapViewAttributes;
  }
}

export default class MapView extends HTMLElement {
  static readonly observedAttributes: (keyof MapViewAttributes)[] = [
    "movable",
    "legend",
    "mapstyle",
  ] as const;

  private root: HTMLElement;
  private intersectionObserver: IntersectionObserver;
  private mutationObserver: MutationObserver;
  private map?: maplibregl.Map;
  private markers: maplibregl.Marker[] = [];
  readonly selectedMarkerIds = new Set<string>();

  get selectedMarkers(): MapMarker[] {
    return Array.from(this.selectedMarkerIds)
      .map((id) =>
        this.querySelector<MapMarker>(`map-marker#${CSS.escape(id)}`),
      )
      .filter((marker): marker is MapMarker => marker !== null);
  }

  get mapStyle(): MapStyleType {
    const style = this.getAttribute("mapstyle");
    if (style && style in MAP_STYLE_NAMES) {
      return style as MapStyleType;
    }
    return "DEFAULT";
  }

  set mapStyle(value: MapStyleType) {
    this.setAttribute("mapstyle", value);
  }

  constructor() {
    super();

    const shadow = this.attachShadow({
      mode: "open",
      slotAssignment: "manual",
    });
    shadow.adoptedStyleSheets = [stylesheet];

    this.root = document.createElement("figure");
    this.root.id = "root";
    this.root.addEventListener("click", this);
    this.root.addEventListener("focusin", this);
    shadow.append(this.root);

    this.intersectionObserver = new IntersectionObserver(
      this.intersectionObserverCallback.bind(this),
      { rootMargin: "128px 128px 128px 128px", threshold: 0 },
    );
    this.mutationObserver = new MutationObserver(
      this.mutationObserverCallback.bind(this),
    );
  }

  handleEvent(event: Event) {
    switch (event.type) {
      case "click":
        return this.handleClick(event as PointerEvent);
      case "focusin":
        return this.handleFocusIn(event as FocusEvent);
    }
  }

  private handleClick(event: PointerEvent) {
    const target = event.target as HTMLElement;

    const marker = target.closest("map-marker");
    if (marker) {
      this.selectMarker(marker.id, event.shiftKey);
      return;
    }

    // Selection via legend
    const markerId =
      target.closest<HTMLElement>("[data-marker-id]")?.dataset.markerId;
    if (markerId) {
      this.selectMarker(markerId, event.shiftKey);
      this.flyToMarker(markerId);
      return;
    }

    this.clearSelection();
  }

  private handleFocusIn(event: FocusEvent) {
    const target = event.target as HTMLElement;
    const marker = target.closest("map-marker");
    if (marker) {
      this.selectMarker(marker.id);
    }
  }

  private getMarkers() {
    return this.querySelectorAll<MapMarker>("map-marker");
  }

  private get legendItems() {
    return (
      this.shadowRoot
        ?.getElementById("legend")
        ?.querySelectorAll<HTMLElement>(".legend-item") ?? []
    );
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
    element.dataset.markerId = markerElement.id;
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
      style: getStyleUrl(this.mapStyle),
      center:
        markers.length === 1 ? [markers[0]!.long, markers[0]!.lat] : undefined,
      bounds: this.getBounds(),
      zoom: 13,
      attributionControl: { compact: true },
      fitBoundsOptions: { padding: 32 },
    });
    this.map.addControl(new maplibregl.NavigationControl(), "bottom-right");

    if (this.hasAttribute("legend")) {
      this.showLegend();
    }

    this.updateSlots();

    this.mutationObserver.observe(this, { childList: true });

    requestAnimationFrame(() => this.map?.resize());
  }

  connectedCallback() {
    this.intersectionObserver.observe(this);
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
      case "mapstyle":
        this.map.setStyle(getStyleUrl(this.mapStyle));
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
    this.markers = [];
    this.getMarkers().forEach((marker) => this.addMarker(marker));
    this.updateLegendItems();
  }

  private updateLegendItems() {
    const legend = this.shadowRoot?.getElementById("legend");
    if (!legend) {
      return;
    }

    const fragment = document.createDocumentFragment();
    for (const marker of this.getMarkers()) {
      fragment.append(this.createLegendItem(marker));
    }
    legend.replaceChildren(fragment);
  }

  private createLegendItem(marker: MapMarker) {
    const item = document.createElement("button");
    item.className = "legend-item";
    item.type = "button";
    item.role = "option";
    item.ariaSelected = this.selectedMarkerIds.has(marker.id)
      ? "true"
      : "false";
    item.dataset.markerId = marker.id;

    const label = document.createElement("span");
    label.className = "legend-label";
    label.textContent = marker.getAttribute("label") || "Unnamed place";

    item.append(label);
    return item;
  }

  private showLegend() {
    if (this.shadowRoot?.getElementById("legend")) {
      return;
    }
    const legend = document.createElement("div");
    legend.id = "legend";
    legend.role = "listbox";
    legend.ariaLabel = "Map places";
    this.root.append(legend);
    this.updateLegendItems();
  }

  private hideLegend() {
    this.shadowRoot?.getElementById("legend")?.remove();
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
    marker.focus({ preventScroll: true });
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

  selectMarker(markerId: string, addToSelection = false) {
    if (!addToSelection) {
      this.selectedMarkerIds.clear();
    }
    this.selectedMarkerIds.add(markerId);
    this.updateMarkerSelection();
    this.dispatchEvent(new MapEvent("mapselectionchange"));
  }

  clearSelection() {
    this.selectedMarkerIds.clear();
    this.updateMarkerSelection();
    this.dispatchEvent(new MapEvent("mapselectionchange"));
  }

  private updateMarkerSelection() {
    for (const marker of this.getMarkers()) {
      marker.selected = this.selectedMarkerIds.has(marker.id);
    }
    for (const item of this.legendItems) {
      const markerId = item.dataset.markerId;
      item.ariaSelected =
        markerId && this.selectedMarkerIds.has(markerId) ? "true" : "false";
    }
  }

  project(coordinates: { lat: number; long: number }): {
    x: number;
    y: number;
  } {
    if (!this.map) {
      throw new Error("Map is not initialized");
    }
    const point = this.map.project([coordinates.long, coordinates.lat]);
    return { x: point.x, y: point.y };
  }

  unproject(point: { x: number; y: number }): { lat: number; long: number } {
    if (!this.map) {
      throw new Error("Map is not initialized");
    }
    const lngLat = this.map.unproject([point.x, point.y]);
    return { lat: lngLat.lat, long: lngLat.lng };
  }
}

customElements.define("map-view", MapView);
