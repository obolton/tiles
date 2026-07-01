import css from "./ScrollView.css?inline";
import arrowUpIcon from "@/icons/arrow-up.svg?raw";
import arrowDownIcon from "@/icons/arrow-down.svg?raw";
import arrowLeftIcon from "@/icons/arrow-left.svg?raw";
import arrowRightIcon from "@/icons/arrow-right.svg?raw";
import type { DragDropEvent } from "@/utils/drag";

const stylesheet = new CSSStyleSheet();
stylesheet.replaceSync(css);

const SCROLL_MARGIN = 50;

enum ScrollViewStates {
  SCROLLABLE = "scrollable",
}

declare global {
  interface HTMLElementTagNameMap {
    "scroll-view": ScrollView;
  }
}

export default class ScrollView extends HTMLElement {
  readonly contents: HTMLDivElement;

  private readonly internals: ElementInternals;
  private readonly container: HTMLDivElement;
  private readonly upButton: HTMLButtonElement;
  private readonly downButton: HTMLButtonElement;
  private readonly leftButton: HTMLButtonElement;
  private readonly rightButton: HTMLButtonElement;
  private readonly resizeObserver: ResizeObserver;

  private scrollSpeed = 0;
  private lastScrollFrame: DOMHighResTimeStamp = 0;

  constructor() {
    super();

    const shadow = this.attachShadow({ mode: "closed" });
    shadow.adoptedStyleSheets = [stylesheet];

    this.internals = this.attachInternals();
    this.internals.role = "group";
    this.internals.ariaRoleDescription = "carousel";
    this.internals.ariaOrientation = "horizontal";

    this.container = document.createElement("div");
    this.container.id = "container";
    this.container.part.add("container");
    this.container.addEventListener("scroll", this, { passive: true });

    this.contents = document.createElement("div");
    this.contents.id = "contents";
    this.contents.part.add("contents");
    this.contents.append(document.createElement("slot"));
    this.container.append(this.contents);

    this.upButton = document.createElement("button");
    this.upButton.id = "up";
    this.upButton.classList.add("button");
    this.upButton.part.add("navigation");
    this.upButton.type = "button";
    this.upButton.ariaLabel = "Scroll up";
    this.upButton.tabIndex = 0;
    this.upButton.innerHTML = arrowUpIcon;
    this.upButton.addEventListener("click", this);

    this.downButton = document.createElement("button");
    this.downButton.id = "down";
    this.downButton.classList.add("button");
    this.downButton.part.add("navigation");
    this.downButton.type = "button";
    this.downButton.ariaLabel = "Scroll down";
    this.downButton.tabIndex = 0;
    this.downButton.innerHTML = arrowDownIcon;
    this.downButton.addEventListener("click", this);

    this.leftButton = document.createElement("button");
    this.leftButton.id = "left";
    this.leftButton.classList.add("button");
    this.leftButton.part.add("navigation");
    this.leftButton.type = "button";
    this.leftButton.ariaLabel = "Scroll left";
    this.leftButton.tabIndex = 0;
    this.leftButton.innerHTML = arrowLeftIcon;
    this.leftButton.addEventListener("click", this);

    this.rightButton = document.createElement("button");
    this.rightButton.id = "right";
    this.rightButton.classList.add("button");
    this.rightButton.part.add("navigation");
    this.rightButton.type = "button";
    this.rightButton.ariaLabel = "Scroll down";
    this.rightButton.tabIndex = 0;
    this.rightButton.innerHTML = arrowRightIcon;
    this.rightButton.addEventListener("click", this);

    shadow.append(
      this.upButton,
      this.downButton,
      this.leftButton,
      this.rightButton,
      this.container,
    );

    this.resizeObserver = new ResizeObserver(this.onResize.bind(this));
  }

  connectedCallback() {
    this.addEventListener("keydown", this);
    this.addEventListener("dnd-dragover", this, { passive: true });
    this.addEventListener("dnd-dragleave", this, { passive: true });
    this.resizeObserver.observe(this);
    this.resizeObserver.observe(this.contents);
    this.updateButtons();
  }

  disconnectedCallback() {
    this.removeEventListener("keydown", this);
    this.removeEventListener("dnd-dragover", this);
    this.removeEventListener("dnd-dragleave", this);
    this.resizeObserver.disconnect();
  }

  handleEvent(event: Event) {
    switch (event.type) {
      case "click":
        return this.handleClick(event as MouseEvent);
      case "keydown":
        return this.handleKeyDown(event as KeyboardEvent);
      case "scroll":
        return this.handleScroll();
      case "dnd-dragover":
        return this.handleDragOver(event as DragDropEvent);
      case "dnd-dragleave":
        return this.handleDragLeave();
    }
  }

  private handleClick(event: MouseEvent) {
    const target = event.currentTarget;
    if (!(target instanceof HTMLElement)) {
      return;
    }

    event.preventDefault();

    switch (target.id) {
      case "up":
        return this.up();
      case "down":
        return this.down();
      case "left":
        return this.left();
      case "right":
        return this.right();
    }
  }

  private handleKeyDown(event: KeyboardEvent) {
    if (
      event.defaultPrevented ||
      event.repeat ||
      event.shiftKey ||
      event.ctrlKey ||
      event.altKey ||
      event.metaKey
    ) {
      return;
    }

    switch (event.key) {
      case "ArrowUp":
        event.preventDefault();
        event.stopPropagation();
        this.up();
        break;

      case "ArrowDown":
        event.preventDefault();
        event.stopPropagation();
        this.down();
        break;

      case "ArrowLeft":
        event.preventDefault();
        event.stopPropagation();
        this.left();
        break;

      case "ArrowRight":
        event.preventDefault();
        event.stopPropagation();
        this.right();
        break;
    }
  }

  private getElementUp() {
    const style = getComputedStyle(this.container);
    const scrollPaddingTop = parseFloat(style.scrollPaddingTop);
    const top = this.container.scrollTop + scrollPaddingTop;

    let element: HTMLElement | null = null;
    for (const child of this.children) {
      if (
        child instanceof HTMLElement &&
        child.offsetTop < top &&
        (!element || child.offsetTop > element.offsetTop)
      ) {
        element = child;
      }
    }
    return element;
  }

  private getElementDown() {
    const scrollTop = this.container.scrollTop;
    const style = getComputedStyle(this.container);
    const scrollPaddingTop = parseFloat(style.scrollPaddingTop);
    const scrollPaddingBottom = parseFloat(style.scrollPaddingBottom);
    const top = scrollTop + scrollPaddingTop;
    const bottom = scrollTop + this.container.clientHeight - scrollPaddingBottom;

    let element: HTMLElement | null = null;
    for (const child of this.children) {
      if (
        child instanceof HTMLElement &&
        child.offsetTop > top &&
        child.offsetTop + child.clientHeight > bottom &&
        (!element || child.offsetTop < element.offsetTop)
      ) {
        element = child;
      }
    }
    return element;
  }

  private getElementLeft() {
    const style = getComputedStyle(this.container);
    const scrollPaddingLeft = parseFloat(style.scrollPaddingLeft);
    const left = this.container.scrollLeft + scrollPaddingLeft;

    let element: HTMLElement | null = null;
    for (const child of this.children) {
      if (
        child instanceof HTMLElement &&
        child.offsetLeft < left &&
        (!element || child.offsetLeft > element.offsetLeft)
      ) {
        element = child;
      }
    }
    return element;
  }

  private getElementRight() {
    const scrollLeft = this.container.scrollLeft;
    const style = getComputedStyle(this.container);
    const scrollPaddingLeft = parseFloat(style.scrollPaddingLeft);
    const scrollPaddingRight = parseFloat(style.scrollPaddingRight);
    const left = scrollLeft + scrollPaddingLeft;
    const right = scrollLeft + this.container.clientWidth - scrollPaddingRight;

    let element: HTMLElement | null = null;
    for (const child of this.children) {
      if (
        child instanceof HTMLElement &&
        child.offsetLeft > left &&
        child.offsetLeft + child.clientWidth > right &&
        (!element || child.offsetLeft < element.offsetLeft)
      ) {
        element = child;
      }
    }
    return element;
  }

  private scrollToElement(element: HTMLElement) {
    const style = getComputedStyle(this.container);
    const scrollPaddingTop = parseFloat(style.scrollPaddingTop);
    const scrollPaddingLeft = parseFloat(style.scrollPaddingLeft);
    this.container.scroll({
      top: element.offsetTop - scrollPaddingTop,
      left: element.offsetLeft - scrollPaddingLeft,
      behavior: "smooth",
    });
  }

  scrollToTop() {
    this.container.scroll({ top: 0, behavior: "smooth" });
  }

  scrollToBottom() {
    this.container.scroll({
      top: this.container.scrollHeight - this.container.clientHeight,
      behavior: "smooth",
    });
  }

  scrollToLeft() {
    this.container.scroll({ left: 0, behavior: "smooth" });
  }

  scrollToRight() {
    this.container.scroll({
      left: this.container.scrollWidth - this.container.clientWidth,
      behavior: "smooth",
    });
  }

  up() {
    const element = this.getElementUp();
    if (element) {
      this.scrollToElement(element);
    } else {
      this.scrollToTop();
    }
  }

  down() {
    const element = this.getElementDown();
    if (element) {
      this.scrollToElement(element);
    } else {
      this.scrollToBottom();
    }
  }

  left() {
    const element = this.getElementLeft();
    if (element) {
      this.scrollToElement(element);
    } else {
      this.scrollToLeft();
    }
  }

  right() {
    const element = this.getElementRight();
    if (element) {
      this.scrollToElement(element);
    } else {
      this.scrollToRight();
    }
  }

  private updateButtons() {
    this.upButton.disabled = this.container.scrollTop < 16;
    this.downButton.disabled =
      this.container.scrollTop > this.container.scrollHeight - this.container.clientHeight - 16;
    this.leftButton.disabled = this.container.scrollLeft < 16;
    this.rightButton.disabled =
      this.container.scrollLeft > this.container.scrollWidth - this.container.clientWidth - 16;
  }

  private handleScroll() {
    this.updateButtons();
  }

  private handleDragOver({ clientX }: DragDropEvent) {
    const rect = this.getBoundingClientRect();
    const previousScrollSpeed = this.scrollSpeed;

    if (typeof clientX !== "number") {
      return;
    }

    if (clientX <= rect.left + SCROLL_MARGIN) {
      this.scrollSpeed = -Math.max(Math.min(1 - (clientX - rect.left) / SCROLL_MARGIN, 1), 0);
    } else if (rect.right - clientX <= SCROLL_MARGIN) {
      this.scrollSpeed = Math.max(Math.min(1 - (rect.right - clientX) / SCROLL_MARGIN, 1), 0);
    } else {
      this.scrollSpeed = 0;
    }

    if (previousScrollSpeed === 0 && this.scrollSpeed !== 0) {
      this.container.classList.add("scrolling");
      requestAnimationFrame(this.scrollFrame.bind(this));
    }
  }

  private handleDragLeave() {
    this.scrollSpeed = 0;
  }

  private onResize() {
    if (this.scrollable) {
      this.internals.states.add(ScrollViewStates.SCROLLABLE);
    } else {
      this.internals.states.delete(ScrollViewStates.SCROLLABLE);
    }
    this.updateButtons();
  }

  get scrollable() {
    return (
      this.container.scrollHeight > this.container.clientHeight ||
      this.container.scrollWidth > this.container.clientWidth
    );
  }

  private scrollFrame(timestamp: DOMHighResTimeStamp) {
    if (this.scrollSpeed === 0) {
      this.container.classList.remove("scrolling");
      return;
    }

    if (!this.lastScrollFrame) {
      this.lastScrollFrame = timestamp;
    }

    const elapsed = timestamp - this.lastScrollFrame;
    const distance = this.scrollSpeed * (elapsed / 1000) * 200;
    if (Math.abs(distance) > 1) {
      this.container.scrollBy({
        left: distance,
        behavior: "instant",
      });
      this.lastScrollFrame = timestamp;
    }

    requestAnimationFrame(this.scrollFrame.bind(this));
  }

  // Scroll properties

  get scrollLeft() {
    return this.container.scrollLeft;
  }

  set scrollLeft(value: number) {
    this.container.scrollLeft = value;
  }

  get scrollTop() {
    return this.container.scrollTop;
  }

  set scrollTop(value: number) {
    this.container.scrollTop = value;
  }
}

customElements.define("scroll-view", ScrollView);
