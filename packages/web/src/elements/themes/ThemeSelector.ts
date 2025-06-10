import type SwipeView from "@/elements/swipe/SwipeView";

export type GetItem = (index: number, contents: Node) => HTMLElement;

export interface ThemeSelectorAttributes {
  value?: string;
  min?: string;
  max?: string;
}

export default class ThemeSelector extends HTMLElement {
  static readonly observedAttributes: (keyof ThemeSelectorAttributes)[] = [
    "value",
    "min",
    "max",
  ] as const;

  value = 0;
  min = 0;
  max = Infinity;
  getItem: GetItem | null = null;

  readonly contents: HTMLElement;

  private internals: ElementInternals;
  private swipe: SwipeView | null = null;

  constructor() {
    super();

    this.internals = this.attachInternals();

    this.contents = document.createElement("span");
    this.contents.classList.add("theme-selector-contents");

    this.addEventListener("pointerdown", this, { passive: true });
  }

  get open() {
    return this.internals.states.has("open");
  }

  set open(value: boolean) {
    if (value) {
      this.internals.states.add("open");
    } else {
      this.internals.states.delete("open");
    }
  }

  connectedCallback() {
    if (this.getItem) {
      this.appendChild(this.getItem(this.value, this.contents));
    }
  }

  attributeChangedCallback(
    name: keyof ThemeSelectorAttributes,
    _: string | null,
    value: string | null,
  ) {
    switch (name) {
      case "value":
        if (value) {
          this.value = parseInt(value, 10);
          if (this.swipe) {
            this.swipe.value = this.value;
          }
        }
        return;
      case "min":
        if (value) {
          this.min = parseInt(value, 10);
          if (this.swipe) {
            this.swipe.min = this.min;
          }
        }
        return;
      case "max":
        if (value) {
          this.max = parseInt(value, 10);
          if (this.swipe) {
            this.swipe.max = this.max;
          }
        }
        return;
    }
  }

  handleEvent(event: Event) {
    switch (event.type) {
      case "pointerdown":
        return this.handlePointerDown();
      case "click":
        return this.handleClick(event as MouseEvent);
      case "keydown":
        return this.handleKeyDown(event as KeyboardEvent);
      case "change":
        return this.handleChange();
    }
  }

  private handlePointerDown() {
    if (!this.open) {
      this.show();
    }
  }

  private handleClick(event: MouseEvent) {
    if (
      this.open &&
      event.target instanceof Element &&
      !this.contains(event.target)
    ) {
      this.hide();
    }
  }

  private handleKeyDown(event: KeyboardEvent) {
    if (event.key === "Escape" && this.open) {
      this.hide();
      event.preventDefault();
    }
  }

  private handleChange() {
    if (!this.swipe) {
      return;
    }

    const previousValue = this.value;
    this.value = this.swipe.value;

    // TODO: Merge SwipeView into this element to simplify this
    const newPreviousItem = this.getLiveItem(previousValue);
    const previousSlot = this.swipe.shadowRoot?.querySelector(
      `li[value="${previousValue}"]`,
    )?.firstElementChild as HTMLSlotElement | undefined;
    this.swipe.appendChild(newPreviousItem);
    previousSlot?.assignedElements().forEach((element) => element.remove());
    previousSlot?.assign(newPreviousItem);

    const item = this.getLiveItem(this.swipe.value);
    const slot = this.swipe.shadowRoot?.querySelector(
      `li[value="${this.swipe.value}"]`,
    )?.firstElementChild as HTMLSlotElement | undefined;
    this.swipe.appendChild(item);
    slot?.assignedElements().forEach((element) => element.remove());
    slot?.assign(item);

    this.dispatchEvent(new Event("change"));
  }

  private getLiveItem(index: number) {
    if (!this.getItem) {
      throw new Error("getItem is not provided");
    }

    return this.getItem(
      index,
      index === this.value ? this.contents : this.contents.cloneNode(true),
    );
  }

  private show() {
    if (this.open || this.swipe) {
      return;
    }

    this.open = true;

    const swipe = document.createElement("swipe-view") as SwipeView;
    this.swipe = swipe;
    swipe.value = this.value;
    swipe.min = this.min;
    swipe.max = this.max;
    swipe.getItem = this.getLiveItem.bind(this);
    swipe.addEventListener("change", this);

    this.replaceChildren(swipe);

    addEventListener("click", this, { passive: true });
    addEventListener("keydown", this);
  }

  private hide() {
    if (!this.open) {
      return;
    }

    this.open = false;
    this.swipe = null;

    this.replaceChildren(this.getLiveItem(this.value));

    removeEventListener("click", this);
    removeEventListener("keydown", this);
  }
}

customElements.define("theme-selector", ThemeSelector);
