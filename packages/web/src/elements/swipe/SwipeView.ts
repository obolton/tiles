import css from "./SwipeView.css?inline";
import { smoothScrollBehavior } from "@/utils/scroll";
import upIcon from "@/icons/arrow-up.svg?raw";
import downIcon from "@/icons/arrow-down.svg?raw";
import type { GlobalHTMLAttributes } from "jsx/html-attributes";

const stylesheet = new CSSStyleSheet();
stylesheet.replaceSync(css);

export type GetItem = (index: number) => HTMLElement | null;

export interface SwipeViewAttributes extends GlobalHTMLAttributes {
  value?: string;
  min?: string;
  max?: string;
}

declare global {
  interface HTMLElementTagNameMap {
    "swipe-view": SwipeView;
  }
}

declare module "jsx/html-attributes" {
  interface HTMLAttributesByTagName {
    "swipe-view": SwipeViewAttributes;
  }
}

const ITEM_GAP = 8;

export default class SwipeView extends HTMLElement {
  static readonly observedAttributes: (keyof SwipeViewAttributes)[] = [
    "value",
    "min",
    "max",
  ] as const;

  value = 0;
  min = 0;
  max = Infinity;
  getItem: GetItem | null = null;

  private carousel: HTMLElement;
  private items: HTMLUListElement;
  private buttons: HTMLElement;
  private previousButton: HTMLButtonElement;
  private nextButton: HTMLButtonElement;
  private itemHeights: number[] = [];
  private height = 0;
  private intersectionObserver: IntersectionObserver;
  private resizeObserver: ResizeObserver;

  constructor() {
    super();

    const shadow = this.attachShadow({
      mode: "open",
      slotAssignment: "manual",
    });
    shadow.adoptedStyleSheets = [stylesheet];

    this.carousel = document.createElement("div");
    this.carousel.part = "carousel";
    this.carousel.id = "carousel";
    this.carousel.role = "group";
    this.carousel.ariaRoleDescription = "carousel";
    this.carousel.ariaOrientation = "horizontal";

    this.items = document.createElement("ul");
    this.items.id = "items";
    this.carousel.appendChild(this.items);

    this.previousButton = document.createElement("button");
    this.previousButton.type = "button";
    this.previousButton.ariaLabel = "Previous theme";
    this.previousButton.disabled = true;
    this.previousButton.innerHTML = upIcon;
    this.previousButton.addEventListener("pointerdown", this);
    this.previousButton.addEventListener("click", this);

    this.nextButton = document.createElement("button");
    this.nextButton.type = "button";
    this.previousButton.ariaLabel = "Next theme";
    this.nextButton.disabled = true;
    this.nextButton.innerHTML = downIcon;
    this.nextButton.addEventListener("pointerdown", this);
    this.nextButton.addEventListener("click", this);

    this.buttons = document.createElement("div");
    this.buttons.id = "buttons";
    this.buttons.part = "buttons";
    this.buttons.popover = "manual";
    this.buttons.append(this.previousButton, this.nextButton);

    shadow.append(this.carousel, this.buttons);

    this.intersectionObserver = new IntersectionObserver(
      this.intersectionObserverCallback.bind(this),
      {
        root: this.carousel,
        rootMargin: "-16px 0px -16px 0px",
        threshold: 0,
      },
    );

    this.resizeObserver = new ResizeObserver(this.resizeObserverCallback.bind(this));
  }

  connectedCallback() {
    if (this.value > this.min) {
      this.appendItem(this.value - 1);
    }
    this.appendItem(this.value);
    if (this.value < this.max) {
      this.appendItem(this.value + 1);
    }

    this.previousButton.disabled = this.value === 0;
    this.nextButton.disabled = this.value === this.max;

    this.buttons.showPopover();

    addEventListener("keydown", this);
  }

  disconnectedCallback() {
    this.intersectionObserver.disconnect();
    this.resizeObserver.disconnect();
    this.items.replaceChildren();
    this.replaceChildren();

    this.buttons.hidePopover();

    removeEventListener("keydown", this);
  }

  attributeChangedCallback(
    name: keyof SwipeViewAttributes,
    _: string | null,
    value: string | null,
  ) {
    switch (name) {
      case "value":
        if (value) {
          this.value = parseInt(value, 10);
        }
        return;
      case "min":
        if (value) {
          this.min = parseInt(value, 10);
        }
        return;
      case "max":
        if (value) {
          this.max = parseInt(value, 10);
        }
        return;
    }
  }

  private intersectionObserverCallback(entries: IntersectionObserverEntry[]) {
    for (const entry of entries) {
      if (entry.isIntersecting && entry.target instanceof HTMLLIElement) {
        const value = entry.target.value;
        this.select(entry.target);

        if (entry.target === this.items.firstElementChild && value > this.min) {
          this.prependItem(value - 1);
        }
        if (entry.target === this.items.lastElementChild && value < this.max) {
          this.appendItem(value + 1);
        }
        return;
      }
    }
  }

  private resizeObserverCallback(entries: ResizeObserverEntry[]) {
    let heightChanged = false;

    for (const entry of entries) {
      const {
        target,
        borderBoxSize: [size],
      } = entry;
      if (!(target instanceof HTMLLIElement) || !size) {
        continue;
      }

      const index = target.value;
      const height = size.blockSize + ITEM_GAP;

      if (height !== this.itemHeights[index]) {
        this.itemHeights[index] = height;
        heightChanged = true;
      }
    }

    if (heightChanged) {
      this.updateLayout();
    }
  }

  private createItem(index: number) {
    const li = document.createElement("li");
    li.value = index;
    const slot = document.createElement("slot");
    li.append(slot);
    li.ariaSelected = index === this.value ? "true" : "false";
    return li;
  }

  private prependItem(index: number) {
    const element = this.getItem?.(index);
    if (!element) {
      return;
    }

    this.appendChild(element);

    const item = this.createItem(index);
    item.style.setProperty("--top", "0");
    this.items.prepend(item);
    item.querySelector("slot")!.assign(element);

    const rect = item.getBoundingClientRect();
    const itemHeight = rect.height + ITEM_GAP;
    this.itemHeights[index] = itemHeight;
    this.height += itemHeight;
    this.updateLayout();
    this.intersectionObserver.observe(item);
    this.resizeObserver.observe(item);

    if (index === this.value) {
      this.updateScrollPosition(this.height);
    } else if (index < this.value) {
      this.updateScrollPosition(this.carousel.scrollTop + itemHeight);
    }

    return item;
  }

  private appendItem(index: number) {
    const element = this.getItem?.(index);
    if (!element) {
      return;
    }

    this.appendChild(element);

    const item = this.createItem(index);
    item.style.setProperty("--top", this.height + "px");
    this.items.appendChild(item);
    item.querySelector("slot")!.assign(element);

    const rect = item.getBoundingClientRect();
    const itemHeight = rect.height + ITEM_GAP;
    this.itemHeights[index] = itemHeight;
    this.height += itemHeight;
    this.intersectionObserver.observe(item);
    this.resizeObserver.observe(item);

    if (index === this.value) {
      this.updateScrollPosition(this.height - itemHeight);
    }

    return item;
  }

  private updateLayout() {
    let top = 0;

    this.itemHeights.forEach((height, index) => {
      const element = this.items.querySelector<HTMLLIElement>(`li[value="${index}"]`);
      element?.style.setProperty("--top", top + "px");

      if (index === this.value) {
        this.updateScrollPosition(top);
      }

      top += height;
    });

    this.height = top;
  }

  private updateScrollPosition(top: number) {
    this.carousel.style.scrollSnapType = "none";
    this.carousel.scrollTop = top;
    this.carousel.style.scrollSnapType = "";
  }

  previous() {
    const item = this.items.querySelector<HTMLLIElement>(`li[value="${this.value - 1}"]`);
    if (item) {
      this.carousel.scroll({
        top: parseFloat(item.style.getPropertyValue("--top")),
        behavior: smoothScrollBehavior(),
      });
    }
  }

  next() {
    const item = this.items.querySelector<HTMLLIElement>(`li[value="${this.value + 1}"]`);
    if (item) {
      this.carousel.scroll({
        top: parseFloat(item.style.getPropertyValue("--top")),
        behavior: smoothScrollBehavior(),
      });
    }
  }

  private select(element: HTMLLIElement) {
    this.items.querySelector('li[aria-selected="true"]')?.setAttribute("aria-selected", "false");
    element.setAttribute("aria-selected", "true");

    if (this.value !== element.value) {
      this.value = element.value;
      this.dispatchEvent(new Event("change"));

      this.previousButton.disabled = element.value === 0;
      this.nextButton.disabled = element.value === this.max;
    }
  }

  handleEvent(event: Event) {
    switch (event.type) {
      case "pointerdown":
        return this.handlePointerDown(event as PointerEvent);
      case "click":
        return this.handleClick(event as MouseEvent);
      case "keydown":
        return this.handleKeyDown(event as KeyboardEvent);
    }
  }

  private handlePointerDown(event: PointerEvent) {
    if (event.currentTarget === this.previousButton) {
      event.preventDefault();
      event.stopPropagation();
      this.previous();
    }
    if (event.currentTarget === this.nextButton) {
      event.preventDefault();
      event.stopPropagation();
      this.next();
    }
  }

  private handleClick(event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
  }

  private handleKeyDown(event: KeyboardEvent) {
    if (event.repeat || event.shiftKey || event.ctrlKey || event.metaKey) {
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();

      if (event.altKey) {
        this.previous();
      } else {
        document.getSelection()?.modify("move", "backward", "line");
      }
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();

      if (event.altKey) {
        this.next();
      } else {
        document.getSelection()?.modify("move", "forward", "line");
      }
      return;
    }
  }
}

customElements.define("swipe-view", SwipeView);
