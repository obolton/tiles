import css from "./SwipeView.css?inline";

const stylesheet = new CSSStyleSheet();
stylesheet.replaceSync(css);

export type GetItem = (index: number) => HTMLElement | null;

export interface SwipeViewAttributes {
  value?: string;
  min?: string;
  max?: string;
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
  private height = 0;
  private intersectionObserver: IntersectionObserver;

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

    shadow.append(this.carousel);

    this.intersectionObserver = new IntersectionObserver(
      this.intersectionObserverCallback.bind(this),
      {
        root: this.carousel,
        rootMargin: "-16px 0px -16px 0px",
        threshold: 0,
      },
    );
  }

  connectedCallback() {
    if (this.value > this.min) {
      this.appendItem(this.value - 1);
    }
    const item = this.appendItem(this.value);
    if (this.value < this.max) {
      this.appendItem(this.value + 1);
    }
    if (item) {
      this.carousel.scrollLeft = item.offsetLeft;
    }

    addEventListener("keydown", this);
  }

  disconnectedCallback() {
    this.intersectionObserver.disconnect();
    this.items.replaceChildren();
    this.replaceChildren();

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

  intersectionObserverCallback(entries: IntersectionObserverEntry[]) {
    for (const entry of entries) {
      if (entry.isIntersecting && entry.target instanceof HTMLLIElement) {
        const value = entry.target.value;
        this.select(entry.target);

        if (entry.target === this.items.firstElementChild && value > this.min) {
          this.prependItem(value - 1);
        } else if (
          entry.target === this.items.lastElementChild &&
          value < this.max
        ) {
          this.appendItem(value + 1);
        }
        return;
      }
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

    const itemHeight = item.offsetHeight + 8;

    for (const child of this.items.children) {
      if (child instanceof HTMLElement && child !== item) {
        child.style.setProperty(
          "--top",
          parseFloat(child.style.getPropertyValue("--top")) + itemHeight + "px",
        );
      }
    }

    if (index === this.value) {
      this.carousel.scrollTop = this.height;
    } else {
      this.carousel.scrollTop += itemHeight;
    }

    this.height += itemHeight;
    this.intersectionObserver?.observe(item);

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

    if (index === this.value) {
      this.carousel.scrollTop = this.height;
    }

    // TODO: Re-layout when size changes
    this.height += item.offsetHeight + ITEM_GAP;
    this.intersectionObserver?.observe(item);

    return item;
  }

  previous() {
    const item = this.items.querySelector<HTMLLIElement>(
      `li[value="${this.value - 1}"]`,
    );
    if (item) {
      this.carousel.scroll({
        top: parseFloat(item.style.getPropertyValue("--top")),
        behavior: "smooth",
      });
    }
  }

  next() {
    const item = this.items.querySelector<HTMLLIElement>(
      `li[value="${this.value + 1}"]`,
    );
    if (item) {
      this.carousel.scroll({
        top: parseFloat(item.style.getPropertyValue("--top")),
        behavior: "smooth",
      });
    }
  }

  private select(element: HTMLLIElement) {
    this.items
      .querySelector('li[aria-selected="true"]')
      ?.setAttribute("aria-selected", "false");
    element.setAttribute("aria-selected", "true");

    if (this.value !== element.value) {
      this.value = element.value;
      this.dispatchEvent(new Event("change"));
    }
  }

  handleEvent(event: Event) {
    switch (event.type) {
      case "keydown":
        return this.handleKeyDown(event as KeyboardEvent);
    }
  }

  private handleKeyDown(event: KeyboardEvent) {
    if (
      event.repeat ||
      event.shiftKey ||
      event.ctrlKey ||
      event.altKey ||
      event.metaKey
    ) {
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      event.stopPropagation();
      this.previous();
    } else if (event.key === "ArrowDown") {
      event.preventDefault();
      event.stopPropagation();
      this.next();
    }
  }
}

customElements.define("swipe-view", SwipeView);
