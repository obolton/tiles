import maplibregl from "maplibre-gl";
import stylesheet from "./MapView.css?url";

const STYLE_URL = `https://api.maptiler.com/maps/streets-v2/style.json?key=${import.meta.env.PUBLIC_MAPTILER_API_KEY}`;

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
  static observedAttributes = [
    "movable",
    "lat",
    "long",
    "bounds",
    "label",
  ] as const;

  private root: HTMLElement;
  private intersectionObserver: IntersectionObserver;
  private map?: maplibregl.Map;
  private labelElement?: HTMLDivElement;

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
      { rootMargin: "0px 0px 0px 0px", threshold: 0 },
    );
  }

  initializeMap() {
    if (this.map) {
      throw new Error("Map is already initialized");
    }

    const movable = !!this.getAttribute("movable");
    const lat = parseFloat(this.getAttribute("lat") ?? "0");
    const long = parseFloat(this.getAttribute("long") ?? "0");
    const bounds = parseBounds(this.getAttribute("bounds") ?? "");
    const label = this.getAttribute("label");

    if (!movable) {
      this.root.classList.add("static");
    } else {
      this.root.classList.remove("static");
    }

    this.map = new maplibregl.Map({
      container: this.root,
      style: STYLE_URL,
      center: [long, lat],
      bounds: bounds ?? undefined,
      zoom: 13,
      attributionControl: { compact: true },
    });

    new maplibregl.Marker({
      color: `var(--marker-color)`,
      subpixelPositioning: true,
    })
      .setLngLat([long, lat])
      .addTo(this.map);

    if (label) {
      this.labelElement = document.createElement("div");
      this.labelElement.classList.add("marker");
      this.labelElement.textContent = label;
      new maplibregl.Marker({
        element: this.labelElement,
        offset: [0, -60],
        subpixelPositioning: true,
      })
        .setLngLat([long, lat])
        .addTo(this.map);
    }

    requestAnimationFrame(() => this.map?.resize());
  }

  connectedCallback() {
    this.intersectionObserver.observe(this);
  }

  disconnectedCallback() {
    this.map?.remove();
    this.map = undefined;
    this.labelElement = undefined;
    this.intersectionObserver.unobserve(this);
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
        if (value) {
          this.root.classList.remove("static");
        } else {
          this.root.classList.add("static");
        }
        break;

      case "lat":
        this.map.setCenter([
          parseFloat(this.getAttribute("long") ?? "0"),
          parseFloat(value),
        ]);
        break;

      case "long":
        this.map.setCenter([
          parseFloat(value),
          parseFloat(this.getAttribute("lat") ?? "0"),
        ]);
        break;

      case "bounds":
        {
          const bounds = parseBounds(value);
          if (bounds) {
            this.map.fitBounds(bounds);
          }
        }
        break;

      case "label":
        if (this.labelElement) {
          this.labelElement.textContent = value;
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
}
