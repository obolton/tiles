import css from "./SwatchSelect.css?inline";
import PopoverMenu from "@/elements/menu/PopoverMenu";
import { escapeUTF8 } from "entities";

const stylesheet = new CSSStyleSheet();
stylesheet.replaceSync(css);

export interface SwatchSelectAttributes {
  value?: string | null;
  orientation?: "horizontal" | "vertical";
  align?: "left" | "center" | "right" | "auto";
}

export default class SwatchSelect extends HTMLElement {
  static get observedAttributes() {
    return ["value", "align"] as const;
  }

  #value: string | null = null;

  private internals: ElementInternals;
  private iconSlot: HTMLSlotElement;
  private items: PopoverMenu;

  constructor() {
    super();

    this.internals = this.attachInternals();
    this.internals.role = "menu";

    const shadow = this.attachShadow({ mode: "closed" });
    shadow.adoptedStyleSheets = [stylesheet];

    this.iconSlot = document.createElement("slot");
    this.iconSlot.name = "icon";

    this.items = document.createElement("popover-menu");
    this.items.id = "items";
    this.items.part = "items";
    this.items.anchorElement = this;
    this.items.addEventListener("toggle", this, { passive: true });

    const itemsSlot = document.createElement("slot");
    itemsSlot.addEventListener("slotchange", this);
    this.items.append(itemsSlot);

    shadow.append(this.iconSlot, this.items);

    this.addEventListener("click", this, { passive: true });
  }

  get value() {
    return this.#value;
  }

  set value(value: string | null) {
    if (value === this.#value) {
      return;
    }

    const previousItem = this.#value ? this.getItem(this.#value) : null;
    if (previousItem) {
      previousItem.ariaChecked = "false";
    }

    const item = value ? this.getItem(value) : null;
    if (item) {
      item.ariaChecked = "true";
    }

    this.setIcon(item?.querySelector("svg") ?? null);

    this.#value = value;
  }

  get open() {
    return this.internals.states.has("open");
  }

  set open(open: boolean) {
    if (open) {
      this.internals.states.add("open");
    } else {
      this.internals.states.delete("open");
    }

    this.ariaExpanded = open ? "true" : "false";
    this.ariaPressed = open ? "true" : "false";
  }

  connectedCallback() {
    this.open = false;
  }

  attributeChangedCallback(
    name: (typeof SwatchSelect.observedAttributes)[number],
    _previous: string | null,
    value: string | null,
  ) {
    switch (name) {
      case "value":
        this.value = value;
        break;
      case "align":
        if (value === "left" || value === "center" || value === "right") {
          this.items.align = value;
        } else {
          this.items.align = "auto";
        }
        break;
    }
  }

  // Events

  handleEvent(event: Event) {
    switch (event.type) {
      case "toggle":
        return this.handleToggle(event as ToggleEvent);
      case "click":
        return this.handleClick(event as PointerEvent);
      case "slotchange":
        return this.handleSlotChange();
    }
  }

  private handleToggle(event: ToggleEvent) {
    this.open = event.newState === "open";
  }

  private handleClick(event: PointerEvent) {
    const target = event.target;

    if (target === this) {
      if (this.open) {
        this.hide();
      } else {
        this.show();
      }
      return;
    }

    const item = target instanceof Element ? target.closest("button") : null;
    if (!item) {
      return;
    }
    this.value = item.value;
    this.dispatchEvent(new Event("change", { bubbles: true }));
    this.hide();
  }

  private handleSlotChange() {
    if (this.value) {
      const item = this.getItem(this.value);
      if (item) {
        item.ariaChecked = "true";
      }
      this.setIcon(item?.querySelector("svg") ?? null);
    }
  }

  // Items

  private getItem(value: string) {
    return this.querySelector(`[value="${escapeUTF8(value)}"]`);
  }

  // Icon

  private setIcon(icon: SVGElement | null) {
    for (const element of this.iconSlot.assignedElements()) {
      element.remove();
    }

    if (!icon) {
      return;
    }

    const iconClone = icon.cloneNode(true) as SVGElement;
    iconClone.slot = "icon";
    this.prepend(iconClone);
  }

  // Open and close

  show() {
    if (this.open) {
      return;
    }
    this.open = true;
    this.items.showPopover();
  }

  hide() {
    if (!this.open) {
      return;
    }
    this.open = false;
    this.items.hidePopover();
  }
}

customElements.define("swatch-select", SwatchSelect);
