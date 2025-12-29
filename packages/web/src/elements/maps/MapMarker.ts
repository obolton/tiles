import css from "./MapMarker.css?inline";
import type { GlobalHTMLAttributes } from "@/jsx/html-attributes";

const stylesheet = new CSSStyleSheet();
stylesheet.replaceSync(css);

export interface MapMarkerAttributes extends GlobalHTMLAttributes {
  editable?: boolean;
  selected?: boolean;
  lat?: number;
  long?: number;
  bounds?: string;
  label?: string;
}

declare global {
  interface HTMLElementTagNameMap {
    "map-marker": MapMarker;
  }
}

declare module "@/jsx/html-attributes" {
  interface HTMLAttributesByTagName {
    "map-marker": MapMarkerAttributes;
  }
}

export default class MapMarker extends HTMLElement {
  static readonly observedAttributes: (keyof MapMarkerAttributes)[] = [
    "label",
    "editable",
    "selected",
  ] as const;

  private pin: HTMLDivElement;
  private labelElement: HTMLSpanElement;
  private editingController: AbortController | null = null;

  constructor() {
    super();

    const shadow = this.attachShadow({ mode: "open" });
    shadow.adoptedStyleSheets = [stylesheet];

    this.pin = document.createElement("div");
    this.pin.id = "pin";
    shadow.appendChild(this.pin);

    this.labelElement = document.createElement("span");
    this.labelElement.id = "label";
    this.labelElement.tabIndex = 0;
    shadow.appendChild(this.labelElement);
  }

  attributeChangedCallback(
    name: keyof MapMarkerAttributes,
    _: string,
    value: string | null,
  ) {
    switch (name) {
      case "label": {
        this.value = value;
        break;
      }

      case "editable":
        if (value === null) {
          this.stopEditing();
        } else {
          this.startEditing();
        }
        break;
    }
  }

  handleEvent(event: Event) {
    switch (event.type) {
      case "pointerdown":
      case "mousedown":
      case "click":
      case "dblclick":
      case "keydown":
        event.stopPropagation();
        break;

      case "input":
        this.handleLabelInput();
        break;

      case "blur":
        this.handleLabelBlur();
        break;
    }
  }

  private handleLabelBlur() {
    this.dispatchEvent(new Event("change", { bubbles: true }));
  }

  get lat() {
    return parseFloat(this.getAttribute("lat") ?? "0");
  }

  set lat(value: number) {
    this.setAttribute("lat", value.toString());
  }

  get long() {
    return parseFloat(this.getAttribute("long") ?? "0");
  }

  set long(value: number) {
    this.setAttribute("long", value.toString());
  }

  get value() {
    return this.labelElement.textContent;
  }

  set value(value: string | null) {
    this.labelElement.textContent = value;
  }

  private handleLabelInput() {
    if (
      this.labelElement.childElementCount === 1 &&
      this.labelElement.children[0]?.tagName === "BR"
    ) {
      this.labelElement.children[0].remove();
    }
  }

  getBounds() {
    const value = this.getAttribute("bounds");

    if (!value) {
      return null;
    }

    const values = value.split(",", 4);
    if (values.length !== 4) {
      throw new Error("Invalid bounding box");
    }

    return values.map(parseFloat) as [number, number, number, number];
  }

  private startEditing() {
    this.editingController = new AbortController();
    const { signal } = this.editingController;

    this.labelElement.contentEditable = "plaintext-only";
    this.labelElement.setAttribute("data-placeholder", "Add a label");
    this.labelElement.addEventListener("pointerdown", this, { signal });
    this.labelElement.addEventListener("mousedown", this, { signal });
    this.labelElement.addEventListener("click", this, { signal });
    this.labelElement.addEventListener("dblclick", this, { signal });
    this.labelElement.addEventListener("keydown", this, { signal });
    this.labelElement.addEventListener("input", this, { signal });
    this.labelElement.addEventListener("blur", this, { signal });
  }

  private stopEditing() {
    this.labelElement.removeAttribute("contenteditable");
    this.editingController?.abort();
    this.editingController = null;
  }

  get selected() {
    return this.hasAttribute("selected");
  }

  set selected(value: boolean) {
    this.toggleAttribute("selected", value);
    this.ariaSelected = value ? "true" : "false";
  }
}

customElements.define("map-marker", MapMarker);
