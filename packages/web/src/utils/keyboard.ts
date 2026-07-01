export type Orientation = "horizontal" | "vertical" | "both";

export interface KeyboardNavigationOptions {
  /** CSS selector for navigable items within the container */
  selector: string;
  /** Navigation orientation (default: "horizontal") */
  orientation?: Orientation;
  /** Whether navigation wraps at the ends (default: true) */
  wrap?: boolean;
  /** Called after focus moves to a new item */
  onFocus?: (item: HTMLElement) => void;
}

export default class KeyboardNavigation implements EventListenerObject {
  private container: HTMLElement;
  private selector: string;
  private orientation: Orientation;
  private wrap: boolean;
  private onFocus?: (item: HTMLElement) => void;

  constructor(container: HTMLElement, options: KeyboardNavigationOptions) {
    this.container = container;
    this.selector = options.selector;
    this.orientation = options.orientation ?? "horizontal";
    this.wrap = options.wrap ?? true;
    this.onFocus = options.onFocus;
  }

  /**
   * Attach the keyboard listener to the container.
   *  */
  attach() {
    this.container.addEventListener("keydown", this);
  }

  /**
   * Detach the keyboard listener from the container.
   */
  detach() {
    this.container.removeEventListener("keydown", this);
  }

  /**
   * All navigable items.
   */
  get items(): HTMLElement[] {
    return Array.from(this.container.querySelectorAll<HTMLElement>(this.selector));
  }

  /**
   * The currently active item.
   */
  get activeItem(): HTMLElement | null {
    return this.container.querySelector<HTMLElement>(`${this.selector}[tabindex="0"]`);
  }

  /**
   * Set the active item. Updates tabindex on all items.
   * Pass focus=true to also move focus to the new active item.
   */
  setActiveItem(item: HTMLElement | null, focus = false) {
    for (const el of this.items) {
      el.tabIndex = el === item ? 0 : -1;
    }
    if (focus && item) {
      item.focus();
      this.onFocus?.(item);
    }
  }

  /**
   * Focus the first navigable item.
   */
  focusFirst() {
    const first = this.items[0];
    if (first) {
      this.setActiveItem(first, true);
    }
  }

  /**
   * Re-scan and update tabindex after items have changed.
   * Preserves current active item if still present; falls back to first item.
   */
  update() {
    const items = this.items;
    const current = this.activeItem;
    const active = current && items.includes(current) ? current : items[0];

    for (const item of items) {
      item.tabIndex = item === active ? 0 : -1;
    }
  }

  handleEvent(event: Event) {
    if (event.type === "keydown") {
      this.handleKeyDown(event as KeyboardEvent);
    }
  }

  private handleKeyDown(event: KeyboardEvent) {
    const target = event.target;

    if (event.defaultPrevented || !(target instanceof Element)) {
      return;
    }

    const item = target.closest<HTMLElement>(this.selector) ?? this.activeItem;

    if (!item) {
      return;
    }

    const items = this.items;
    const index = items.indexOf(item);
    if (index === -1) {
      return;
    }

    const next = this.getNextIndex(event.key, index, items.length);
    if (next === null) {
      return;
    }

    event.preventDefault();

    const newItem = items[next];
    if (newItem) {
      this.setActiveItem(newItem, true);
    }
  }

  private getNextIndex(key: string, index: number, length: number): number | null {
    let delta: number;

    switch (key) {
      case "Home":
        return 0;
      case "End":
        return length - 1;
      case "ArrowLeft":
        if (this.orientation === "vertical") {
          return null;
        }
        delta = -1;
        break;
      case "ArrowRight":
        if (this.orientation === "vertical") {
          return null;
        }
        delta = 1;
        break;
      case "ArrowUp":
        if (this.orientation === "horizontal") {
          return null;
        }
        delta = -1;
        break;
      case "ArrowDown":
        if (this.orientation === "horizontal") {
          return null;
        }
        delta = 1;
        break;
      default:
        return null;
    }

    const next = index + delta;
    if (next < 0) {
      return this.wrap ? length - 1 : 0;
    }
    if (next >= length) {
      return this.wrap ? 0 : length - 1;
    }
    return next;
  }
}
