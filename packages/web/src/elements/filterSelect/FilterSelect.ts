import { escapeUTF8 } from "entities";
import css from "./FilterSelect.css?inline";

const stylesheet = new CSSStyleSheet();
stylesheet.replaceSync(css);

export interface FilterSelectAttributes {
  placeholder?: string;
  value?: string;
}

declare global {
  interface HTMLElementTagNameMap {
    "filter-select": FilterSelect;
  }
}

export default class FilterSelect extends HTMLElement {
  static readonly observedAttributes: (keyof FilterSelectAttributes)[] = [
    "placeholder",
    "value",
  ] as const;

  #value = "";

  private readonly internals: ElementInternals;
  private readonly input: HTMLInputElement;
  private readonly itemsSlot: HTMLSlotElement;

  constructor() {
    super();

    this.internals = this.attachInternals();

    const shadow = this.attachShadow({
      mode: "closed",
      slotAssignment: "manual",
      delegatesFocus: true,
    });
    shadow.adoptedStyleSheets = [stylesheet];

    this.input = document.createElement("input");
    this.input.id = "input";
    this.input.type = "text";
    this.input.part = "input";
    this.input.addEventListener("input", this, { passive: true });

    const list = document.createElement("div");
    list.id = "list";
    list.role = "listbox";

    this.itemsSlot = document.createElement("slot");
    list.appendChild(this.itemsSlot);

    shadow.append(this.input, list);

    this.addEventListener("click", this);
    this.addEventListener("keydown", this);
  }

  connectedCallback() {
    this.filter();
  }

  attributeChangedCallback(
    name: keyof FilterSelectAttributes,
    _: string | null,
    value: string | null,
  ) {
    switch (name) {
      case "placeholder":
        this.placeholder = value ?? "";
        break;

      case "value":
        if (typeof value === "string") {
          this.value = value;
        }
        break;
    }
  }

  // Events

  handleEvent(event: Event) {
    switch (event.type) {
      case "input":
        return this.handleInput(event as InputEvent);
      case "click":
        return this.handleClick(event as PointerEvent);
      case "keydown":
        return this.handleKeyDown(event as KeyboardEvent);
    }
  }

  private handleInput(_event: InputEvent) {
    requestAnimationFrame(() => this.filter());
  }

  private handleClick(event: PointerEvent) {
    if (!(event.target instanceof Element)) {
      return;
    }

    const item = event.target.closest<HTMLElement>("[data-value]");
    if (!item) {
      return;
    }

    this.value = item.dataset.value!;
  }

  private handleKeyDown(event: KeyboardEvent) {
    const items = this.itemsSlot.assignedElements();
    const active = this.ariaActiveDescendantElement;
    const activeIndex = active ? items.indexOf(active) : -1;

    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();

        if (event.altKey) {
          this.setActiveOption(items.at(-1));
        } else {
          this.setActiveOption(
            activeIndex < 0
              ? items.at(0)
              : items.at((activeIndex + 1) % items.length),
          );
        }
        break;

      case "ArrowUp":
        event.preventDefault();
        if (event.altKey) {
          this.setActiveOption(items.at(0));
        } else {
          this.setActiveOption(
            activeIndex < 0
              ? items.at(-1)
              : items.at((activeIndex - 1 + items.length) % items.length),
          );
        }
        break;

      case "Enter":
        event.preventDefault();
        if (active instanceof HTMLElement && active.dataset.value) {
          this.value = active.dataset.value;
        }
        break;
    }
  }

  // Value

  get value() {
    return this.#value;
  }

  set value(value: string) {
    if (value === this.#value) {
      return;
    }

    this.#value = value;

    this.querySelectorAll('[data-value][aria-selected="true"]')
      .values()
      .forEach((option) => {
        option.ariaSelected = "false";
      });

    const option = this.querySelector(`[data-value="${escapeUTF8(value)}"]`);
    if (option) {
      option.ariaSelected = "true";
    }

    this.dispatchEvent(new Event("change", { bubbles: true }));
  }

  // Placeholder

  get placeholder() {
    return this.input.placeholder;
  }

  set placeholder(value: string) {
    this.input.placeholder = value;
  }

  // Input value

  get inputValue() {
    return this.input.value;
  }

  set inputValue(value: string) {
    this.input.value = value;
  }

  // Filtering

  private filter() {
    const filter = this.inputValue.toLowerCase();
    const options = this.querySelectorAll<HTMLElement>("[data-value]")
      .values()
      .filter((item) =>
        filter ? item.dataset.value?.toLowerCase().includes(filter) : true,
      );
    this.itemsSlot.assign(...options);
  }

  // Active option

  private setActiveOption(option?: Element | null) {
    this.ariaActiveDescendantElement = option ?? null;

    this.querySelectorAll<HTMLElement>('[data-value][data-active="true"]')
      .values()
      .forEach((option) => {
        delete option.dataset.active;
      });

    option?.setAttribute("data-active", "true");
  }
}

customElements.define("filter-select", FilterSelect);
