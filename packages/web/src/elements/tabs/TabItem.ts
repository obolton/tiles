import TabPanel from "./TabPanel";
import type { GlobalHTMLAttributes } from "@/jsx/html-attributes";

declare global {
  interface HTMLElementTagNameMap {
    "tab-item": TabItem;
  }
}

export interface TabItemAttributes extends GlobalHTMLAttributes {
  selected?: boolean;
  for?: string;
}

declare module "@/jsx/html-attributes" {
  interface HTMLAttributesByTagName {
    "tab-item": TabItemAttributes;
  }
}

export default class TabItem extends HTMLElement {
  static readonly observedAttributes: (keyof TabItemAttributes)[] = ["for"] as const;

  private internals: ElementInternals;

  constructor() {
    super();

    this.internals = this.attachInternals();
    this.internals.role = "tab";
  }

  connectedCallback() {
    if (this.selected) {
      this.select();
    } else {
      this.deselect();
    }
  }

  attributeChangedCallback(name: keyof TabItemAttributes, _: string, value: string | null) {
    switch (name) {
      case "for":
        if (value === null) {
          this.removeAttribute("aria-controls");
        } else {
          this.setAttribute("aria-controls", value);
        }
    }
  }

  get selected() {
    return this.hasAttribute("selected");
  }

  set selected(value: boolean) {
    if (value) {
      this.select();
    } else {
      this.deselect();
    }
  }

  get panel() {
    const forId = this.getAttribute("for");
    if (!forId) {
      return null;
    }

    const root = this.getRootNode();
    if (!(root instanceof Document || root instanceof ShadowRoot)) {
      return null;
    }

    const panel = root.getElementById(forId);
    if (!panel || !(panel instanceof TabPanel)) {
      return null;
    }

    return panel;
  }

  select() {
    this.setAttribute("selected", "");
    this.internals.ariaSelected = "true";
    this.panel?.show();
  }

  deselect() {
    this.removeAttribute("selected");
    this.internals.ariaSelected = "false";
    this.panel?.hide();
  }
}

customElements.define("tab-item", TabItem);
