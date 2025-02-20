import MapEvent from "./MapEvent";
import type MapView from "./MapView";
import css from "./MapLegendItem.css?inline";
import { PRIMARY_MOUSE_BUTTON } from "@/constants/input";

const stylesheet = new CSSStyleSheet();
stylesheet.replaceSync(css);

export interface MapLegendItemAttributes {
  marker: string;
  editable?: boolean;
  ondeletemarker?: (event: MapEvent) => void;
}

export default class MapLegendItem extends HTMLElement {
  static readonly observedAttributes: (keyof MapLegendItemAttributes)[] = [
    "marker",
    "editable",
  ] as const;

  constructor() {
    super();

    const shadowRoot = this.attachShadow({ mode: "open" });
    shadowRoot.adoptedStyleSheets = [stylesheet];

    this.addEventListener("pointerdown", this);
    this.addEventListener("keydown", this);

    const label = document.createElement("span");
    label.append(document.createElement("slot"));
    shadowRoot.append(label);
  }

  attributeChangedCallback(
    name: keyof MapLegendItemAttributes,
    _: string,
    value: string | null,
  ) {
    switch (name) {
      case "editable":
        if (value === null) {
          this.hideDeleteButton();
        } else {
          this.showDeleteButton();
        }
        break;
    }
  }

  handleEvent(event: Event) {
    switch (event.type) {
      case "pointerdown":
        return this.handlePointerDown(event as PointerEvent);

      case "keydown":
        return this.handleKeyDown(event as KeyboardEvent);
    }
  }

  private handlePointerDown(event: PointerEvent) {
    if (event.button === PRIMARY_MOUSE_BUTTON) {
      event.preventDefault();
      event.stopPropagation();
      this.flyToMarker();
    }
  }

  private handleKeyDown(event: KeyboardEvent) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      event.stopPropagation();
      this.flyToMarker();
    }
  }

  private getMap() {
    return this.closest<MapView>("map-view");
  }

  private showDeleteButton() {
    if (this.shadowRoot?.getElementById("delete")) {
      return;
    }

    const button = document.createElement("button");
    button.id = "delete";
    button.classList.add("delete");
    button.title = "Delete";
    button.type = "button";
    button.ariaLabel = "Delete";
    button.addEventListener("pointerdown", (event) => event.stopPropagation());
    button.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      this.dispatchEvent(
        new MapEvent("deletemarker", {
          markerId: this.getAttribute("marker") ?? "",
        }),
      );
    });
    this.shadowRoot?.append(button);
  }

  private hideDeleteButton() {
    this.shadowRoot?.getElementById("delete")?.remove();
  }

  private flyToMarker() {
    const markerId = this.getAttribute("marker");
    if (markerId) {
      this.getMap()?.flyToMarker(markerId);
    }
  }
}
