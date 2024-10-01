import css from "./MapLegendItem.css?inline";
import MapEvent from "./MapEvent";
import type MapView from "./MapView";

const stylesheet = new CSSStyleSheet();
stylesheet.replaceSync(css);

export default class MapLegendItem extends HTMLElement {
  static observedAttributes = ["marker", "delete"] as const;

  private shadow: ShadowRoot;
  private deleteButton?: HTMLButtonElement;

  constructor() {
    super();

    this.addEventListener("pointerdown", this);

    this.shadow = this.attachShadow({ mode: "closed" });
    this.shadow.adoptedStyleSheets = [stylesheet];

    const label = document.createElement("span");
    label.append(document.createElement("slot"));

    this.shadow.append(label);
  }

  handleEvent(event: Event) {
    switch (event.type) {
      case "pointerdown": {
        const markerId = this.getAttribute("marker");
        if (markerId) {
          this.getMap()?.flyToMarker(markerId);
        }
        break;
      }
    }
  }

  getMap() {
    return this.closest<MapView>("map-view");
  }

  private showDeleteButton() {
    if (this.deleteButton) {
      return;
    }

    this.deleteButton = document.createElement("button");
    this.deleteButton.classList.add("delete");
    this.deleteButton.setAttribute("title", "Delete");
    this.deleteButton.setAttribute("type", "button");
    this.deleteButton.setAttribute("aria-label", "Delete");
    this.deleteButton.addEventListener("pointerdown", (event) =>
      event.stopPropagation(),
    );
    this.deleteButton.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      this.getMap()?.dispatchEvent(
        new MapEvent("delete-marker", {
          markerId: this.getAttribute("marker") ?? "",
        }),
      );
    });
    this.shadow.append(this.deleteButton);
  }

  private hideDeleteButton() {
    this.deleteButton?.remove();
    this.deleteButton = undefined;
  }

  attributeChangedCallback(
    name: (typeof MapLegendItem.observedAttributes)[number],
    _: string,
    value: string,
  ) {
    switch (name) {
      case "delete":
        if (value === "true") {
          this.showDeleteButton();
        } else {
          this.hideDeleteButton();
        }
        break;
    }
  }
}
