import { escapeUTF8 } from "entities";

declare global {
  interface HTMLElementTagNameMap {
    "list-box": ListBox;
  }
}

export type Orientation = "vertical" | "horizontal";

export interface ListBoxAttributes {
  orientation?: Orientation;
}

export default class ListBox extends HTMLElement {
  static get observedAttributes() {
    return ["orientation"] as const;
  }

  orientation: Orientation = "vertical";

  protected readonly internals: ElementInternals;

  #value = "";

  constructor() {
    super();

    this.internals = this.attachInternals();
    this.internals.role = "listbox";

    this.addEventListener("click", this);
    this.addEventListener("keydown", this);
  }

  // Items

  get items() {
    return this.querySelectorAll<HTMLElement>("[data-value]");
  }

  // Attributes

  attributeChangedCallback(
    name: (typeof ListBox.observedAttributes)[number],
    _: string | null,
    value: string | null,
  ) {
    switch (name) {
      case "orientation":
        this.orientation =
          value === "vertical" || value === "horizontal" ? value : "vertical";
        break;
    }
  }

  // Events

  handleEvent(event: Event) {
    switch (event.type) {
      case "click":
        return this.handleClick(event as PointerEvent);
      case "keydown":
        return this.handleKeyDown(event as KeyboardEvent);
    }
  }

  private handleClick(event: PointerEvent) {
    if (!(event.target instanceof Element)) {
      return;
    }

    const item = event.target.closest<HTMLElement>("[data-value]");
    if (item) {
      this.value = item.dataset.value ?? "";
    }
  }

  private handleKeyDown(event: KeyboardEvent) {
    switch (event.key) {
      case "ArrowUp":
        if (this.orientation === "vertical") {
          event.preventDefault();
          if (event.altKey) {
            this.focusFirstItem();
          } else {
            this.focusPreviousItem();
          }
        }
        break;

      case "ArrowDown":
        if (this.orientation === "vertical") {
          event.preventDefault();
          if (event.altKey) {
            this.focusLastItem();
          } else {
            this.focusNextItem();
          }
        }
        break;

      case "ArrowLeft":
        if (this.orientation === "horizontal") {
          event.preventDefault();
          if (event.altKey) {
            this.focusFirstItem();
          } else {
            this.focusPreviousItem();
          }
        }
        break;

      case "ArrowRight":
        if (this.orientation === "horizontal") {
          event.preventDefault();
          if (event.altKey) {
            this.focusLastItem();
          } else {
            this.focusNextItem();
          }
        }
        break;

      case "Enter":
        event.preventDefault();
        if (this.activeElement instanceof HTMLElement) {
          this.value = this.activeElement.dataset.value ?? "";
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

  // Active element

  get activeElement() {
    return this.ariaActiveDescendantElement;
  }

  set activeElement(element: Element | null) {
    this.ariaActiveDescendantElement = element;

    this.querySelectorAll<HTMLElement>('[data-value][data-active="true"]')
      .values()
      .forEach((compareOption) => {
        if (compareOption !== element) {
          delete compareOption.dataset.active;
        }
      });

    if (!element) {
      return;
    }

    element.setAttribute("data-active", "true");

    const rect = this.getBoundingClientRect();
    const optionRect = element.getBoundingClientRect();

    // Scroll option into view if needed
    if (this.orientation === "vertical") {
      if (optionRect.top < rect.top || optionRect.bottom > rect.bottom) {
        const top = optionRect.top - rect.top;
        this.scrollTo({ top });
      }
    } else {
      if (optionRect.left < rect.left || optionRect.right > rect.right) {
        const left = optionRect.left - rect.left;
        this.scrollTo({ left });
      }
    }
  }

  private focusFirstItem() {
    this.activeElement = this.firstElementChild;
  }

  private focusLastItem() {
    this.activeElement = this.lastElementChild;
  }

  private focusNextItem() {
    const next = this.activeElement?.nextElementSibling;
    if (next) {
      this.activeElement = next;
    } else {
      this.focusFirstItem();
    }
  }

  private focusPreviousItem() {
    const previous = this.activeElement?.previousElementSibling;

    if (previous) {
      this.activeElement = previous;
    } else {
      this.focusLastItem();
    }
  }
}

customElements.define("list-box", ListBox);
