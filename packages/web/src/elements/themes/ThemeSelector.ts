import css from "./ThemeSelector.css?inline";
import type SwipeView from "@/elements/swipe/SwipeView";
import { DEFAULT_TIMING } from "@/utils/animation/effects";

const stylesheet = new CSSStyleSheet();
stylesheet.replaceSync(css);

type GetItem = (index: number) => HTMLElement | null;

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

  private internals: ElementInternals;
  private swipe: SwipeView | null = null;

  constructor() {
    super();

    this.internals = this.attachInternals();

    this.addEventListener("pointerenter", this, { passive: true });
    this.addEventListener("pointerleave", this, { passive: true });
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
      case "pointerenter":
        return this.handlePointerEnter(event as PointerEvent);
      case "pointerleave":
        return this.handlePointerLeave(event as PointerEvent);
      case "change":
        return this.handleChange();
    }
  }

  private async handlePointerEnter(event: PointerEvent) {
    if (event.currentTarget === this && !this.open) {
      this.show();
    }
  }

  private async handlePointerLeave(event: PointerEvent) {
    if (event.currentTarget === this && this.open) {
      this.hide();
    }
  }

  private handleChange() {
    if (!this.swipe) {
      return;
    }
    this.value = this.swipe.value;
    this.dispatchEvent(new Event("change"));
  }

  private show() {
    if (this.open || this.swipe) {
      return;
    }

    this.open = true;

    const swipe = document.createElement("swipe-view") as SwipeView;
    this.swipe = swipe;
    swipe.id = "swipe";
    swipe.popover = "manual";
    swipe.value = this.value;
    swipe.min = this.min;
    swipe.max = this.max;
    swipe.getItem = this.getItem;
    swipe.addEventListener("change", this);

    if (this.firstElementChild) {
      const rect = this.firstElementChild.getBoundingClientRect();
      const { width, height, left, top } = rect;
      swipe.style.width = width + "px";
      swipe.style.height = height + "px";
      swipe.style.left = left + "px";
      swipe.style.top = top + "px";
    }

    this.appendChild(swipe);

    swipe.showPopover();
  }

  private hide() {
    if (!this.open || !this.swipe) {
      return;
    }

    this.open = false;

    this.swipe
      .animate([{ opacity: 1 }, { opacity: 0 }], DEFAULT_TIMING)
      .finished.then(() => {
        this.swipe?.hidePopover();
        this.swipe?.remove();
        this.swipe = null;
      });
  }
}

customElements.define("theme-selector", ThemeSelector);
