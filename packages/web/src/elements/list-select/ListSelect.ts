import css from "./ListSelect.css?inline";
import AnchoredPopover from "@/elements/anchored-popover/AnchoredPopover";
import type { GlobalHTMLAttributes } from "@/jsx/html-attributes";
import { reveal } from "@/utils/scroll";

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
  private buttonLabel: HTMLSpanElement;
  private labelSlot: HTMLSlotElement;
  private items: AnchoredPopover;
  private mutationObserver: MutationObserver;

  constructor() {
    super();

    this.internals = this.attachInternals();
    this.internals.role = "combobox";
    this.internals.ariaHasPopup = "listbox";

    const shadow = this.attachShadow({ mode: "closed" });
    shadow.adoptedStyleSheets = [stylesheet];

    this.defaultIconSlot = document.createElement("slot");
    this.defaultIconSlot.name = "default-icon";
    this.defaultIconSlot.part.add("default-icon");

    this.iconSlot = document.createElement("slot");
    this.iconSlot.name = "icon";
    this.iconSlot.part.add("icon");

    this.buttonLabel = document.createElement("span");
    this.buttonLabel.id = "button-label";
    this.buttonLabel.hidden = true;

    this.labelSlot = document.createElement("slot");
    this.labelSlot.name = "label";

    this.items = document.createElement("anchored-popover");
    this.items.id = "items";
    this.items.part = "items";
    this.items.addEventListener("toggle", this, { passive: true });

    const listbox = document.createElement("div");
    listbox.id = "listbox";
    listbox.role = "listbox";
    listbox.ariaLabelledByElements = [this.buttonLabel];

    const itemsSlot = document.createElement("slot");
    listbox.append(itemsSlot);

    const footerSlot = document.createElement("slot");
    footerSlot.name = "footer";

    this.items.append(listbox, footerSlot);

    const button = document.createElement("div");
    button.id = "button";
    button.part.add("button");
    button.append(
      this.defaultIconSlot,
      this.iconSlot,
      this.buttonLabel,
      this.labelSlot,
    );

    shadow.append(button, this.items);

    this.addEventListener("click", this, { passive: true });
    this.addEventListener("pointermove", this, { passive: true });
    this.addEventListener("keydown", this);
    this.addEventListener("focusout", this, { passive: true });

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
      this.buttonLabel.textContent = label;
      this.buttonLabel.hidden = false;
      this.internals.ariaLabelledByElements = [this.buttonLabel];
    } else {
      this.buttonLabel.hidden = true;
      this.internals.ariaLabelledByElements = [];
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
      previousItem.ariaSelected = "false";
    }

    const item = value === null ? null : this.getItem(value);
    if (item) {
      item.ariaSelected = "true";
    } else if (value !== null) {
      // Item doesn't exist yet, observe for when it's added
      this.mutationObserver.observe(this, {
        childList: true,
        subtree: true,
      });
    }
    this.showItem(item);

    this.#value = value;

    if (value !== null) {
      this.internals.states.add("has-value");
    } else {
      this.internals.states.delete("has-value");
    }
  }

  get open() {
    return this.internals.states.has("open");
  }

  set open(open: boolean) {
    if (open) {
      this.internals.states.add("open");
    } else {
      this.internals.states.delete("open");
      this.activeItem = null;
    }

    this.ariaExpanded = open ? "true" : "false";
  }

  connectedCallback() {
    if (!this.hasAttribute("tabindex")) {
      this.tabIndex = 0;
    }
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
      case "pointermove":
        return this.handlePointerMove(event as PointerEvent);
      case "keydown":
        return this.handleKeyDown(event as KeyboardEvent);
      case "focusout":
        return this.handleFocusOut(event as FocusEvent);
    }
  }

  private handleFocusOut(event: FocusEvent) {
    if (
      this.open &&
      !(
        event.relatedTarget instanceof Node &&
        this.contains(event.relatedTarget)
      )
    ) {
      this.hide();
    }
  }

  private handleToggle(event: ToggleEvent) {
    this.open = event.newState === "open";
  }

  private handlePointerMove(event: PointerEvent) {
    const target = event.target;
    if (!(target instanceof Element)) {
      return;
    }
    const option = target.closest<HTMLElement>('[role="option"]');
    if (
      option &&
      option !== this.activeItem &&
      option.ariaDisabled !== "true"
    ) {
      this.activeItem = option;
    }
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

    const item =
      target instanceof Element
        ? target.closest<HTMLElement>('[role="option"]')
        : null;
    if (item) {
      this.selectOption(item);
    }
  }

  private handleKeyDown(event: KeyboardEvent) {
    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        event.stopPropagation();
        if (this.open) {
          this.highlightNext();
        } else {
          this.show();
        }
        break;

      case "ArrowUp":
        event.preventDefault();
        event.stopPropagation();
        if (this.open) {
          this.highlightPrevious();
        } else {
          this.show();
        }
        break;

      case "Enter":
      case " ":
        event.preventDefault();
        event.stopPropagation();
        if (this.open) {
          this.selectActiveOption();
        } else {
          this.show();
        }
        break;

      case "Home":
        if (this.open) {
          event.preventDefault();
          event.stopPropagation();
          this.activeItem = this.options[0] ?? null;
        }
        break;

      case "End":
        if (this.open) {
          event.preventDefault();
          event.stopPropagation();
          this.activeItem = this.options.at(-1) ?? null;
        }
        break;

      case "Escape":
        if (this.open) {
          event.preventDefault();
          event.stopPropagation();
          this.hide();
        }
        break;
    }
  }

  private mutationObserverCallback(mutations: MutationRecord[]) {
    const value = this.value;
    if (value === null) {
      return;
    }

    const selector = `[role="option"][data-value="${CSS.escape(value)}"]`;
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        if (!(node instanceof Element)) {
          continue;
        }
        const item = node.matches(selector)
          ? node
          : node.querySelector(selector);
        if (item) {
          item.ariaSelected = "true";
          this.showItem(item);
          this.mutationObserver.disconnect();
          return;
        }
      }
    }
  }

  // Items

  private getItem(value: string) {
    return this.querySelector<HTMLElement>(
      `[role="option"][data-value="${CSS.escape(value)}"]`,
    );
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

  // Keyboard navigation

  private get options(): HTMLElement[] {
    return Array.from(
      this.querySelectorAll<HTMLElement>(
        '[role="option"]:not([hidden], [aria-disabled="true"])',
      ),
    );
  }

  private get activeItem(): HTMLElement | null {
    const element = this.ariaActiveDescendantElement;
    return element instanceof HTMLElement ? element : null;
  }

  private set activeItem(option: HTMLElement | null) {
    this.ariaActiveDescendantElement = option;

    for (const element of this.querySelectorAll<HTMLElement>(
      '[role="option"][data-active]',
    )) {
      delete element.dataset.active;
    }

    if (option) {
      option.dataset.active = "true";
      reveal(this.items, option);
    }
  }

  private selectOption(option: HTMLElement) {
    if (option.ariaDisabled === "true") {
      return;
    }
    const value = option.dataset.value ?? null;
    if (value !== null) {
      this.value = value;
      this.dispatchEvent(new Event("change", { bubbles: true }));
    }
    this.hide();
  }

  private selectActiveOption() {
    const active = this.activeItem;
    if (active) {
      this.selectOption(active);
    } else {
      this.hide();
    }
  }

  private highlightNext() {
    const options = this.options;
    const active = this.activeItem;
    const index = active ? options.indexOf(active) : -1;
    const next = index < 0 ? options[0] : options[(index + 1) % options.length];
    if (next) {
      this.activeItem = next;
    }
  }

  private highlightPrevious() {
    const options = this.options;
    const active = this.activeItem;
    const index = active ? options.indexOf(active) : -1;
    const prev =
      index < 0
        ? options.at(-1)
        : options[(index - 1 + options.length) % options.length];
    if (prev) {
      this.activeItem = prev;
    }
  }

  // Open and close

  show() {
    if (this.open) {
      return;
    }
    this.open = true;
    this.items.showPopover();

    const selected = this.#value !== null ? this.getItem(this.#value) : null;
    this.activeItem = selected ?? this.options[0] ?? null;
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
