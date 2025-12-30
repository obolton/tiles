import type { GlobalHTMLAttributes } from "@/jsx/html-attributes";

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

declare module "@/jsx/html-attributes" {
  interface HTMLAttributesByTagName {
    "toolbar-tab": ToolbarTabAttributes;
  }
}

export default class ToolbarTab extends HTMLElement {
  static readonly observedAttributes: (keyof ToolbarTabAttributes)[] = [
    "selected",
  ] as const;

  private internals: ElementInternals;
  #selected = false;

  constructor() {
    super();

    this.internals = this.attachInternals();
    this.internals.role = "tabpanel";
    this.internals.ariaHidden = "true";
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
