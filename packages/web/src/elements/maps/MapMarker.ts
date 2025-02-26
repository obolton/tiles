import css from "./MapMarker.css?inline";

const stylesheet = new CSSStyleSheet();
stylesheet.replaceSync(css);

export interface MapMarkerAttributes {
  editable?: boolean;
  id: string;
  lat: number;
  long: number;
  bounds?: string;
  label?: string;
  onblur: (event: globalThis.FocusEvent) => void;
}

export default class MapMarker extends HTMLElement {
  static readonly observedAttributes: (keyof MapMarkerAttributes)[] = [
    "label",
    "editable",
  ] as const;

  private pin: HTMLDivElement;
  private labelElement: HTMLSpanElement;

  constructor() {
    super();

    const shadow = this.attachShadow({ mode: "open" });
    shadow.adoptedStyleSheets = [stylesheet];

    this.pin = document.createElement("div");
    this.pin.id = "pin";
    this.pin.addEventListener("pointerdown", this);
    this.pin.addEventListener("click", () => this.focus());
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
    }
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
    this.labelElement.contentEditable = "plaintext-only";
    this.labelElement.setAttribute("data-placeholder", "Add a label");
    this.labelElement.addEventListener("pointerdown", this);
    this.labelElement.addEventListener("mousedown", this);
    this.labelElement.addEventListener("click", this);
    this.labelElement.addEventListener("dblclick", this);
    this.labelElement.addEventListener("keydown", this);
    this.labelElement.addEventListener("input", this);
  }

  private stopEditing() {
    this.labelElement.removeAttribute("contenteditable");
    this.labelElement.removeEventListener("pointerdown", this);
    this.labelElement.removeEventListener("mousedown", this);
    this.labelElement.removeEventListener("click", this);
    this.labelElement.removeEventListener("dblclick", this);
    this.labelElement.removeEventListener("keydown", this);
    this.labelElement.removeEventListener("input", this);
  }
}

customElements.define("map-marker", MapMarker);
