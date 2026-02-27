import css from "./ListSelect.css?inline";
import AnchoredPopover from "@/elements/anchored-popover/AnchoredPopover";
import type { GlobalHTMLAttributes } from "@/jsx/html-attributes";

const stylesheet = new CSSStyleSheet();
stylesheet.replaceSync(css);

export interface ListSelectAttributes extends GlobalHTMLAttributes {
  value?: string | number | null;
  orientation?: "horizontal" | "vertical";
  align?: "left" | "center" | "right" | "auto";
  showvalue?: boolean;
  label?: string | null;
}

declare global {
  interface HTMLElementTagNameMap {
    "list-select": ListSelect;
  }
}

declare module "@/jsx/html-attributes" {
  interface HTMLAttributesByTagName {
    "list-select": ListSelectAttributes;
  }
}

export default class ListSelect extends HTMLElement {
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
  private items: AnchoredPopover;
  private itemsTitle: HTMLDivElement;
  private mutationObserver: MutationObserver;

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

    this.itemsTitle = document.createElement("div");
    this.itemsTitle.id = "title";
    this.itemsTitle.hidden = true;

    this.items = document.createElement("anchored-popover");
    this.items.id = "items";
    this.items.part = "items";
    this.items.setAttribute("aria-labelledby", "title");
    this.items.addEventListener("toggle", this, { passive: true });

    const itemsSlot = document.createElement("slot");
    this.items.append(this.itemsTitle, itemsSlot);

    shadow.append(
      this.defaultIconSlot,
      this.iconSlot,
      this.labelSlot,
      this.items,
    );

    this.addEventListener("click", this, { passive: true });

    this.mutationObserver = new MutationObserver((mutations) =>
      this.mutationObserverCallback(mutations),
    );
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
      this.itemsTitle.textContent = label;
      this.itemsTitle.hidden = false;
      this.ariaLabel = label;
    } else {
      this.itemsTitle.hidden = true;
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
    this.showItem(item);
  }

  get value() {
    return this.#value;
  }

  set value(value: string | null) {
    if (value === this.#value) {
      return;
    }

    this.mutationObserver.disconnect();

    const previousItem =
      this.#value === null ? null : this.getItem(this.#value);
    if (previousItem) {
      previousItem.ariaChecked = "false";
    }

    const item = value === null ? null : this.getItem(value);
    if (item) {
      item.ariaChecked = "true";
    } else if (value !== null) {
      // Item doesn't exist yet, observe for when it's added
      this.mutationObserver.observe(this, {
        childList: true,
        subtree: true,
      });
    }
    this.showItem(item);

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

  disconnectedCallback() {
    this.mutationObserver.disconnect();
  }

  attributeChangedCallback(
    name: (typeof ListSelect.observedAttributes)[number],
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
    }
  }

  private handleToggle(event: ToggleEvent) {
    this.open = event.newState === "open";
  }

  private handleClick(event: PointerEvent) {
    if (this.ariaDisabled === "true") {
      return;
    }

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

  private mutationObserverCallback(mutations: MutationRecord[]) {
    const value = this.value;
    if (value === null) {
      return;
    }

    const selector = `button[value="${CSS.escape(value)}"]`;
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        if (!(node instanceof Element)) {
          continue;
        }
        const item = node.matches(selector)
          ? node
          : node.querySelector(selector);
        if (item) {
          item.ariaChecked = "true";
          this.showItem(item);
          this.mutationObserver.disconnect();
          return;
        }
      }
    }
  }

  // Items

  private getItem(value: string) {
    return this.querySelector(`[value="${CSS.escape(value)}"]`);
  }

  private showItem(item: Element | null) {
    for (const element of this.iconSlot.assignedElements()) {
      element.remove();
    }
    for (const element of this.labelSlot.assignedElements()) {
      element.remove();
    }

    // Set icon
    const icon = item?.querySelector("svg");
    if (icon) {
      const iconClone = icon.cloneNode(true) as SVGElement;
      iconClone.slot = "icon";
      this.prepend(iconClone);
      this.internals.states.add("has-item-icon");
    } else {
      this.internals.states.delete("has-item-icon");
    }

    // Set label
    if (!item || !this.#showValue) {
      return;
    }

    const labelText =
      item.getAttribute("data-label") ?? item.textContent?.trim();

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

customElements.define("list-select", ListSelect);
