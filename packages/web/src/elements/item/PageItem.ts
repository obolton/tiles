import css from "./PageItem.css?inline";
import "./ItemHandle";
import type ItemHandle from "./ItemHandle";
import type { GlobalHTMLAttributes } from "@/jsx/html-attributes";

const stylesheet = new CSSStyleSheet();
stylesheet.replaceSync(css);

export interface PageItemAttributes extends GlobalHTMLAttributes {
  allowdrag?: boolean;
  resize?: string | null;
}

declare global {
  interface HTMLElementTagNameMap {
    "page-item": PageItem;
  }
}

declare module "@/jsx/html-attributes" {
  interface HTMLAttributesByTagName {
    "page-item": PageItemAttributes;
  }
}

export default class PageItem extends HTMLElement {
  static readonly observedAttributes = ["allowdrag", "resize", "aria-selected"] as const;

  #handle: ItemHandle | null = null;

  get resize(): string | null {
    return this.getAttribute("resize");
  }

  set resize(value: string | null) {
    if (value === this.resize) {
      return;
    }
    if (value) {
      this.setAttribute("resize", value);
    } else {
      this.removeAttribute("resize");
    }
  }

  constructor() {
    super();

    const shadow = this.attachShadow({ mode: "open" });
    shadow.adoptedStyleSheets = [stylesheet];
    shadow.append(document.createElement("slot"));

    this.addEventListener("pointerenter", this, { passive: true });
    this.addEventListener("pointerleave", this, { passive: true });
  }

  attributeChangedCallback(name: (typeof PageItem.observedAttributes)[number]) {
    switch (name) {
      case "allowdrag":
      case "resize":
      case "aria-selected":
        this.updateHandle();
        break;
    }
  }

  handleEvent() {
    this.updateHandle();
  }

  private updateHandle() {
    const selected = this.getAttribute("aria-selected") === "true";
    const showHandle = this.hasAttribute("allowdrag") && (this.matches(":hover") || selected);
    const showResize = this.resize !== null && selected;

    if (!showHandle && !showResize) {
      this.#handle?.remove();
      this.#handle = null;
      return;
    }

    if (!this.#handle) {
      this.#handle = document.createElement("item-handle");
      this.#handle.target = this;
      this.shadowRoot?.append(this.#handle);
    }

    this.#handle.allowDrag = showHandle;
    this.#handle.resize = showResize ? this.resize : null;
  }
}

customElements.define("page-item", PageItem);
