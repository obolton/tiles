import css from "./SwatchSelect.css?inline";
import PopoverMenu from "@/elements/menu/PopoverMenu";
import { escapeUTF8 } from "entities";

const stylesheet = new CSSStyleSheet();
stylesheet.replaceSync(css);

export interface SwatchSelectAttributes {
  value?: string | null;
  orientation?: "horizontal" | "vertical";
  align?: "left" | "center" | "right" | "auto";
  showvalue?: boolean;
  label?: string | null;
}

export default class SwatchSelect extends HTMLElement {
  static get observedAttributes() {
    return ["value", "align", "showvalue", "label"] as const;
  }

  #value: string | null = null;
  #showValue: boolean = false;
  #label: string | null = null;

  private internals: ElementInternals;
  private defaultIconSlot: HTMLSlotElement;
  private iconSlot: HTMLSlotElement;
  private labelSlot: HTMLSlotElement;
  private itemsLabel: HTMLSpanElement;
  private items: PopoverMenu;

  constructor() {
    super();

    this.internals = this.attachInternals();
    this.internals.role = "menu";

    const shadow = this.attachShadow({ mode: "closed" });
    shadow.adoptedStyleSheets = [stylesheet];

    this.defaultIconSlot = document.createElement("slot");
    this.defaultIconSlot.name = "default-icon";
    this.defaultIconSlot.part.add("default-icon");

    this.iconSlot = document.createElement("slot");
    this.iconSlot.name = "icon";
    this.iconSlot.part.add("icon");

    this.labelSlot = document.createElement("slot");
    this.labelSlot.name = "label";

    this.itemsLabel = document.createElement("span");
    this.itemsLabel.id = "items-label";
    this.itemsLabel.hidden = true;

    this.items = document.createElement("popover-menu");
    this.items.id = "items";
    this.items.part = "items";
    this.items.anchorElement = this;
    this.items.setAttribute("aria-labelledby", "items-label");
    this.items.addEventListener("toggle", this, { passive: true });

    const itemsSlot = document.createElement("slot");
    itemsSlot.addEventListener("slotchange", this);
    this.items.append(this.itemsLabel, itemsSlot);

    shadow.append(
      this.defaultIconSlot,
      this.iconSlot,
      this.labelSlot,
      this.items,
    );

    this.addEventListener("click", this, { passive: true });
  }

  get label() {
    return this.#label;
  }

  set label(label: string | null) {
    if (label === this.#label) {
      return;
    }

    this.#label = label;

    if (label) {
      this.itemsLabel.textContent = label;
      this.itemsLabel.hidden = false;
      this.ariaLabel = label;
    } else {
      this.itemsLabel.hidden = true;
    }
  }

  get showValue() {
    return this.#showValue;
  }

  set showValue(show: boolean) {
    if (show === this.#showValue) {
      return;
    }

    this.#showValue = show;
    const item = this.value === null ? null : this.getItem(this.value);
    this.setLabel(item);
  }

  get value() {
    return this.#value;
  }

  set value(value: string | null) {
    if (value === this.#value) {
      return;
    }

    const previousItem =
      this.#value === null ? null : this.getItem(this.#value);
    if (previousItem) {
      previousItem.ariaChecked = "false";
    }

    const item = value === null ? null : this.getItem(value);
    if (item) {
      item.ariaChecked = "true";
    }

    this.setIcon(item?.querySelector("svg") ?? null);
    this.setLabel(item);

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
      case "showvalue":
        this.showValue = value !== null;
        break;
      case "label":
        this.label = value;
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
    if (this.value !== null) {
      const item = this.getItem(this.value);
      if (item) {
        item.ariaChecked = "true";
      }
      this.setIcon(item?.querySelector("svg") ?? null);
      this.setLabel(item ?? null);
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

    if (icon) {
      // Add the item-specific icon
      const iconClone = icon.cloneNode(true) as SVGElement;
      iconClone.slot = "icon";
      this.prepend(iconClone);
      this.internals.states.add("has-item-icon");
    } else {
      // Fall back to default icon (if slotted)
      this.internals.states.delete("has-item-icon");
    }
  }

  // Label

  private setLabel(item: Element | null) {
    for (const element of this.labelSlot.assignedElements()) {
      element.remove();
    }

    if (!this.#showValue || !item) {
      return;
    }

    const labelText =
      item.getAttribute("data-label") ?? item.textContent?.trim() ?? "";

    if (!labelText) {
      return;
    }

    const labelElement = document.createElement("span");
    labelElement.slot = "label";
    labelElement.textContent = labelText;
    this.prepend(labelElement);
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
