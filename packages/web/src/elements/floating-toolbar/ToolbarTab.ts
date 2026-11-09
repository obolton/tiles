import css from "./ToolbarTab.css?inline";
import type { GlobalHTMLAttributes } from "jsx/html-attributes";

const stylesheet = new CSSStyleSheet();
stylesheet.replaceSync(css);

export interface ToolbarTabAttributes extends GlobalHTMLAttributes {
  label?: string;
  name?: string;
  selected?: boolean;
}

declare global {
  interface HTMLElementTagNameMap {
    "toolbar-tab": ToolbarTab;
  }
}

declare module "jsx/html-attributes" {
  interface HTMLAttributesByTagName {
    "toolbar-tab": ToolbarTabAttributes;
  }
}

export default class ToolbarTab extends HTMLElement {
  static readonly observedAttributes: (keyof ToolbarTabAttributes)[] = ["selected"] as const;

  private internals: ElementInternals;
  #selected = false;

  constructor() {
    super();

    this.internals = this.attachInternals();
    this.internals.role = "tabpanel";
    this.internals.ariaHidden = "true";

    // The scroller carries the overflow and edge fades; the host keeps the surface
    const shadow = this.attachShadow({ mode: "open" });
    shadow.adoptedStyleSheets = [stylesheet];
    const scroller = document.createElement("div");
    scroller.id = "scroller";
    scroller.append(document.createElement("slot"));
    shadow.append(scroller);
  }

  connectedCallback() {
    this.inert = !this.#selected;
  }

  get label(): string {
    return this.getAttribute("label") ?? "";
  }

  set label(value: string) {
    this.setAttribute("label", value);
  }

  get name(): string {
    return this.getAttribute("name") ?? "";
  }

  set name(value: string) {
    this.setAttribute("name", value);
  }

  get selected(): boolean {
    return this.#selected;
  }

  set selected(value: boolean) {
    if (this.#selected === value) {
      return;
    }

    this.#selected = value;
    this.internals.ariaHidden = value ? "false" : "true";
    this.inert = !value;

    if (value) {
      this.setAttribute("selected", "");
    } else {
      this.removeAttribute("selected");
    }
  }

  attributeChangedCallback(
    name: keyof ToolbarTabAttributes,
    _: string | null,
    value: string | null,
  ) {
    switch (name) {
      case "selected":
        this.selected = value !== null;
        break;
    }
  }
}

customElements.define("toolbar-tab", ToolbarTab);
