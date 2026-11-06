import {
  LngLatBounds,
  Map as MapLibreMap,
  Marker,
  NavigationControl,
  setWorkerUrl,
} from "maplibre-gl";
import workerUrl from "maplibre-gl/dist/maplibre-gl-worker.mjs?url";
import MapEvent from "./MapEvent";
import css from "./MapView.css?inline";
import type MapPoint from "./MapPoint";
import type { GlobalHTMLAttributes } from "jsx/html-attributes";

const stylesheet = new CSSStyleSheet();
stylesheet.replaceSync(css);

setWorkerUrl(workerUrl);

type MapStyleType = "DEFAULT" | "SATELLITE" | "WATERCOLOR" | "MONOCHROME";

const MAP_STYLE_NAMES: Record<MapStyleType, string> = {
  DEFAULT: "streets-v4",
  SATELLITE: "satellite",
  WATERCOLOR: "aquarelle",
  MONOCHROME: "toner-v2",
};

function getStyleUrl(style: MapStyleType = "DEFAULT") {
  const slug = MAP_STYLE_NAMES[style];
  // Optional, so read directly until the env registry supports optional values.
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

declare module "jsx/html-attributes" {
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
  private map?: MapLibreMap;
  private markers = new Map<MapPoint, Marker>();
  readonly selectedMarkerIds = new Set<string>();

  get selectedMarkers(): MapPoint[] {
    return Array.from(this.selectedMarkerIds)
      .map((id) => this.getPointById(id))
      .filter((point): point is MapPoint => point !== null);
  }

  getPointById(id: string): MapPoint | null {
    return this.querySelector<MapPoint>(`map-point#${CSS.escape(id)}`);
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
    this.mutationObserver = new MutationObserver(this.mutationObserverCallback.bind(this));
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

    const point = target.closest("map-point");
    if (point) {
      this.selectMarker(point.id, event.shiftKey);
      return;
    }

    // Selection via legend
    const markerId = target.closest<HTMLElement>("[data-marker-id]")?.dataset.markerId;
    if (markerId) {
      this.selectMarker(markerId, event.shiftKey);
      this.flyToMarker(markerId);
      return;
    }

    this.clearSelection();
  }

  private handleFocusIn(event: FocusEvent) {
    const target = event.target as HTMLElement;
    const point = target.closest("map-point");
    if (point) {
      this.selectMarker(point.id);
    }
  }

  private getPoints() {
    return this.getElementsByTagName("map-point");
  }

  private get legendItems() {
    return (
      this.shadowRoot?.getElementById("legend")?.querySelectorAll<HTMLElement>(".legend-item") ?? []
    );
  }

  private getBounds() {
    const points = this.getPoints();

    if (points.length <= 1) {
      return undefined;
    }

    const mapBounds = new LngLatBounds();
    for (const point of points) {
      mapBounds.extend([point.long, point.lat]);
    }
    return mapBounds;
  }

  private addPoint(pointElement: MapPoint) {
    if (!this.map) {
      throw new Error("Map is not initialized");
    }

    const element = document.createElement("div");
    element.classList.add("marker");
    element.dataset.markerId = pointElement.id;
    element.addEventListener("mousedown", (e) => e.stopImmediatePropagation());
    const slot = document.createElement("slot");
    element.appendChild(slot);

    const marker = new Marker({
      element,
      offset: [0, 0],
      subpixelPositioning: true,
    })
      .setLngLat([pointElement.long, pointElement.lat])
      .addTo(this.map);
    this.markers.set(pointElement, marker);

    slot.assign(pointElement);
  }

  private initializeMap() {
    if (this.map) {
      throw new Error("Map is already initialized");
    }

    const points = this.getPoints();

    this.map = new MapLibreMap({
      container: this.root,
      style: getStyleUrl(this.mapStyle),
      center: points.length === 1 ? [points[0]!.long, points[0]!.lat] : undefined,
      bounds: this.getBounds(),
      zoom: 13,
      attributionControl: { compact: true },
      fitBoundsOptions: { padding: 32 },
    });
    this.map.addControl(new NavigationControl(), "bottom-right");

    if (this.hasAttribute("legend")) {
      this.showLegend();
    }

    this.updateSlots();

    this.mutationObserver.observe(this, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["lat", "long"],
    });

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

  attributeChangedCallback(name: keyof MapViewAttributes, _: string, value: string | null) {
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

  mutationObserverCallback(mutations: MutationRecord[]) {
    for (const mutation of mutations) {
      if (mutation.type === "attributes" && mutation.target instanceof HTMLElement) {
        const point = mutation.target.closest("map-point");
        if (point) {
          this.markers.get(point)?.setLngLat([point.long, point.lat]);
        }
        continue;
      }
      if (mutation.type === "childList") {
        this.updateSlots();
        return;
      }
    }
  }

  private updateSlots() {
    for (const marker of this.markers.values()) {
      marker.remove();
    }
    this.markers.clear();
    for (const point of this.getPoints()) {
      this.addPoint(point);
    }
    this.updateLegendItems();
  }

  private updateLegendItems() {
    const legend = this.shadowRoot?.getElementById("legend");
    if (!legend) {
      return;
    }

    const fragment = document.createDocumentFragment();
    for (const point of this.getPoints()) {
      fragment.append(this.createLegendItem(point));
    }
    legend.replaceChildren(fragment);
  }

  private createLegendItem(point: MapPoint) {
    const item = document.createElement("button");
    item.className = "legend-item";
    item.type = "button";
    item.role = "option";
    item.ariaSelected = this.selectedMarkerIds.has(point.id) ? "true" : "false";
    item.dataset.markerId = point.id;

    const label = document.createElement("span");
    label.className = "legend-label";
    label.textContent = point.getAttribute("label") || "Unnamed place";

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
    const point = this.getPointById(markerId);
    if (!point) {
      return;
    }
    this.map?.flyTo({
      center: [point.long, point.lat],
      zoom: 13,
      duration: 500,
    });
    point.focus({ preventScroll: true });
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
    for (const item of this.legendItems) {
      const markerId = item.dataset.markerId;
      item.ariaSelected = markerId && this.selectedMarkerIds.has(markerId) ? "true" : "false";
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
