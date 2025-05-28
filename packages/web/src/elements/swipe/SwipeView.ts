import css from "./SwipeView.css?inline";

const stylesheet = new CSSStyleSheet();
stylesheet.replaceSync(css);

export type GetItem = (index: number) => HTMLElement | null;

export interface SwipeViewAttributes {
  value?: string;
  min?: string;
  max?: string;
}

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
  private intersectionObserver: IntersectionObserver;
  private sentinelIntersectionObserver: IntersectionObserver;

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
        rootMargin: "8px 8px 8px 8px",
        threshold: 0.5,
      },
    );

    this.sentinelIntersectionObserver = new IntersectionObserver(
      this.sentinelIntersectionObserverCallback.bind(this),
      {
        root: this.carousel,
        rootMargin: "0px -70% 0px 30%",
        threshold: 0,
      },
    );

    this.addEventListener("keydown", this);
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
    this.carousel.classList.add("snap");
  }

  disconnectedCallback() {
    this.intersectionObserver.disconnect();
    this.items.replaceChildren();
    this.replaceChildren();
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

  sentinelIntersectionObserverCallback(entries: IntersectionObserverEntry[]) {
    for (const entry of entries) {
      if (
        entry.isIntersecting &&
        entry.target.parentElement instanceof HTMLLIElement
      ) {
        this.select(entry.target.parentElement);
        return;
      }
    }
  }

  private createItem(index: number) {
    const li = document.createElement("li");
    li.value = index;
    const sentinel = document.createElement("div");
    sentinel.className = "sentinel";
    const slot = document.createElement("slot");
    li.append(sentinel, slot);
    this.sentinelIntersectionObserver.observe(sentinel);
    return li;
  }

  private prependItem(index: number) {
    const element = this.getItem?.(index);
    if (!element) {
      return;
    }

    this.appendChild(element);

    const item = this.createItem(index);

    const scrollLeft = this.carousel.scrollLeft;
    this.carousel.classList.remove("snap");
    this.items.prepend(item);
    item.querySelector("slot")!.assign(element);
    const rect = item.getBoundingClientRect();
    this.carousel.scrollLeft = scrollLeft + rect.width + 32;
    this.carousel.classList.add("snap");

    return item;
  }

  private appendItem(index: number) {
    const element = this.getItem?.(index);
    if (!element) {
      return;
    }

    this.appendChild(element);

    const item = this.createItem(index);
    this.items.appendChild(item);
    item.querySelector("slot")!.assign(element);
    this.intersectionObserver?.observe(item);

    return item;
  }

  previous() {
    this.items.querySelector(`li[value="${this.value - 1}"]`)?.scrollIntoView({
      behavior: "smooth",
    });
  }

  next() {
    this.items.querySelector(`li[value="${this.value + 1}"]`)?.scrollIntoView({
      behavior: "smooth",
    });
  }

  private select(element: HTMLLIElement) {
    const { width, height } = element.getBoundingClientRect();
    this.style.width = width + "px";
    this.style.height = height + "px";

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

    if (event.key === "ArrowLeft") {
      event.preventDefault();
      event.stopPropagation();
      this.previous();
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      event.stopPropagation();
      this.next();
    }
  }
}

customElements.define("swipe-view", SwipeView);
