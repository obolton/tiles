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
  private label: HTMLSpanElement;

  constructor() {
    super();

    const shadow = this.attachShadow({ mode: "open" });
    shadow.adoptedStyleSheets = [stylesheet];

    this.pin = document.createElement("div");
    this.pin.id = "pin";
    this.pin.addEventListener("pointerdown", this);
    this.pin.addEventListener("click", () => this.focus());
    shadow.appendChild(this.pin);

    this.label = document.createElement("span");
    this.label.id = "label";
    this.label.tabIndex = 0;
    shadow.appendChild(this.label);
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
    return this.label.textContent;
  }

  set value(value: string | null) {
    this.label.textContent = value;
  }

  private handleLabelInput() {
    if (
      this.label.childElementCount === 1 &&
      this.label.children[0]?.tagName === "BR"
    ) {
      this.label.children[0].remove();
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
    this.label.contentEditable = "plaintext-only";
    this.label.setAttribute("data-placeholder", "Add a label");
    this.label.addEventListener("pointerdown", this);
    this.label.addEventListener("mousedown", this);
    this.label.addEventListener("click", this);
    this.label.addEventListener("dblclick", this);
    this.label.addEventListener("keydown", this);
    this.label.addEventListener("input", this);
  }

  private stopEditing() {
    this.label.removeAttribute("contenteditable");
    this.label.removeEventListener("pointerdown", this);
    this.label.removeEventListener("mousedown", this);
    this.label.removeEventListener("click", this);
    this.label.removeEventListener("dblclick", this);
    this.label.removeEventListener("keydown", this);
    this.label.removeEventListener("input", this);
  }
}
