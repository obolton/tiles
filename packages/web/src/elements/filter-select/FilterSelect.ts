import css from "./FilterSelect.css?inline";
import type { GlobalHTMLAttributes } from "jsx/html-attributes";

const stylesheet = new CSSStyleSheet();
stylesheet.replaceSync(css);

export interface FilterSelectAttributes extends GlobalHTMLAttributes {
  placeholder?: string;
  value?: string;
}

declare global {
  interface HTMLElementTagNameMap {
    "filter-select": FilterSelect;
  }
}

declare module "jsx/html-attributes" {
  interface HTMLAttributesByTagName {
    "filter-select": FilterSelectAttributes;
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
  private readonly list: HTMLElement;
  private readonly childObserver: MutationObserver;

  constructor() {
    super();

    this.internals = this.attachInternals();

    const shadow = this.attachShadow({
      mode: "closed",
      delegatesFocus: true,
    });
    shadow.adoptedStyleSheets = [stylesheet];

    this.input = document.createElement("input");
    this.input.id = "input";
    this.input.type = "text";
    this.input.part = "input";
    this.input.addEventListener("input", this, { passive: true });

    this.list = document.createElement("div");
    this.list.id = "list";
    this.list.role = "listbox";
    this.list.part = "list";

    this.list.appendChild(document.createElement("slot"));

    shadow.append(this.input, this.list);

    this.addEventListener("click", this);
    this.addEventListener("keydown", this);

    // Observe child changes to reapply filter and selected state
    this.childObserver = new MutationObserver(() => {
      this.filter();
      this.updateSelectedState();
    });
  }

  connectedCallback() {
    this.childObserver.observe(this, { childList: true });
    this.filter();
    this.updateSelectedState();
  }

  disconnectedCallback() {
    this.childObserver.disconnect();
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

    this.value = item.dataset.value ?? "";
  }

  private handleKeyDown(event: KeyboardEvent) {
    const items = Array.from(this.querySelectorAll<HTMLElement>("[data-value]:not([hidden])"));
    const active = this.ariaActiveDescendantElement;
    const activeIndex = active instanceof HTMLElement ? items.indexOf(active) : -1;

    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();

        if (event.altKey) {
          this.setActiveOption(items.at(-1));
        } else {
          this.setActiveOption(
            activeIndex < 0 ? items.at(0) : items.at((activeIndex + 1) % items.length),
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
        if (active instanceof HTMLElement) {
          this.value = active.dataset.value ?? "";
        } else {
          this.value = "";
        }
        break;
    }
  }

  // Value

  get value() {
    return this.#value;
  }

  set value(value: string) {
    this.#value = value;
    this.updateSelectedState();
    this.dispatchEvent(new Event("change", { bubbles: true }));
  }

  private updateSelectedState() {
    this.querySelectorAll('[data-value][aria-selected="true"]')
      .values()
      .forEach((option) => {
        option.ariaSelected = "false";
      });

    const option = this.querySelector(`[data-value="${CSS.escape(this.#value)}"]`);
    if (option) {
      option.ariaSelected = "true";
    }
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
    const filter = this.inputValue.toLocaleLowerCase();

    for (const item of this.querySelectorAll<HTMLElement>("[data-value]")) {
      const label = item.dataset.label ?? item.textContent;
      const matches = !filter || label.toLocaleLowerCase().includes(filter);
      item.hidden = !matches;
    }

    if (
      this.ariaActiveDescendantElement instanceof HTMLElement &&
      this.ariaActiveDescendantElement.hidden
    ) {
      const firstVisible = this.querySelector<HTMLElement>("[data-value]:not([hidden])");
      this.setActiveOption(firstVisible);
    }

    const hasVisibleOptions = this.querySelector("[data-value]:not([hidden])");
    this.list.style.display = hasVisibleOptions ? "" : "none";
  }

  // Active option

  private setActiveOption(option?: Element | null) {
    this.ariaActiveDescendantElement = option ?? null;

    this.querySelectorAll<HTMLElement>('[data-value][data-active="true"]')
      .values()
      .forEach((option) => {
        delete option.dataset.active;
      });

    if (option) {
      option.setAttribute("data-active", "true");

      const listRect = this.list.getBoundingClientRect();
      const optionRect = option.getBoundingClientRect();

      // Scroll option into view if needed
      if (optionRect.top < listRect.top || optionRect.bottom > listRect.bottom) {
        const top = optionRect.top - listRect.top;
        this.list.scrollTo({ top });
      }
    }
  }
}

customElements.define("filter-select", FilterSelect);
