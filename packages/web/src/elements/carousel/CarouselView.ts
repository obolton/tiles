import css from "./CarouselView.css?inline";
import type { DragDropEvent } from "@/utils/drag";

const stylesheet = new CSSStyleSheet();
stylesheet.replaceSync(css);

const SCROLL_MARGIN = 50;

enum CarouselViewStates {
  SCROLLABLE = "scrollable",
}

export default class CarouselView extends HTMLElement {
  private internals: ElementInternals;
  private contents: HTMLDivElement;
  private previousButton: HTMLButtonElement;
  private nextButton: HTMLButtonElement;
  private resizeObserver: ResizeObserver;
  private scrollSpeed = 0;
  private lastScrollFrame: DOMHighResTimeStamp = 0;

  constructor() {
    super();

    const shadow = this.attachShadow({ mode: "closed" });
    shadow.adoptedStyleSheets = [stylesheet];

    this.internals = this.attachInternals();

    this.contents = document.createElement("div");
    this.contents.id = "contents";
    this.contents.part.add("contents");
    this.contents.addEventListener("scroll", this, { passive: true });
    this.contents.append(document.createElement("slot"));

    this.previousButton = document.createElement("button");
    this.previousButton.id = "previous";
    this.previousButton.part.add("navigation");
    this.previousButton.type = "button";
    this.previousButton.ariaLabel = "Go to previous item";
    this.previousButton.tabIndex = 0;
    this.previousButton.addEventListener("click", this);

    this.nextButton = document.createElement("button");
    this.nextButton.id = "next";
    this.nextButton.part.add("navigation");
    this.nextButton.type = "button";
    this.nextButton.ariaLabel = "Go to next item";
    this.nextButton.tabIndex = 0;
    this.nextButton.addEventListener("click", this);

    shadow.append(this.previousButton, this.nextButton, this.contents);

    this.resizeObserver = new ResizeObserver(this.onResize.bind(this));

    this.addEventListener("keydown", this);
    this.addEventListener("dnd-dragover", this, { passive: true });
    this.addEventListener("dnd-dragleave", this, { passive: true });

    this.internals.role = "group";
    this.internals.ariaRoleDescription = "carousel";
    this.internals.ariaOrientation = "horizontal";
  }

  connectedCallback() {
    this.resizeObserver.observe(this);
    this.updateButtons();
  }

  disconnectedCallback() {
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
      case "previous":
        return this.previous();
      case "next":
        return this.next();
    }
  }

  private handleKeyDown(event: KeyboardEvent) {
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

  private getFirstVisibleElement() {
    const left = this.contents.scrollLeft;
    for (const child of this.children) {
      if (child instanceof HTMLElement && child.offsetLeft >= left) {
        return child;
      }
    }
    return null;
  }

  private scrollToElement(element: HTMLElement) {
    const style = getComputedStyle(this.contents);
    const scrollPadding = parseFloat(style.scrollPaddingInlineStart);
    this.contents.scroll({
      left: element.offsetLeft - scrollPadding,
      behavior: "smooth",
    });
  }

  previous() {
    const element = this.getFirstVisibleElement()?.previousElementSibling;
    if (element instanceof HTMLElement) {
      this.scrollToElement(element);
    }
  }

  next() {
    const element = this.getFirstVisibleElement()?.nextElementSibling;
    if (element instanceof HTMLElement) {
      this.scrollToElement(element);
    }
  }

  private updateButtons() {
    this.previousButton.disabled = this.contents.scrollLeft < 10;
    this.nextButton.disabled =
      this.contents.scrollLeft >
      this.contents.scrollWidth - this.contents.clientWidth - 10;
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
      this.scrollSpeed = -Math.max(
        Math.min(1 - (clientX - rect.left) / SCROLL_MARGIN, 1),
        0,
      );
    } else if (rect.right - clientX <= SCROLL_MARGIN) {
      this.scrollSpeed = Math.max(
        Math.min(1 - (rect.right - clientX) / SCROLL_MARGIN, 1),
        0,
      );
    } else {
      this.scrollSpeed = 0;
    }

    if (previousScrollSpeed === 0 && this.scrollSpeed !== 0) {
      this.contents.classList.add("scrolling");
      requestAnimationFrame(this.scrollFrame.bind(this));
    }
  }

  private handleDragLeave() {
    this.scrollSpeed = 0;
  }

  private onResize() {
    if (this.scrollable) {
      this.internals.states.add(CarouselViewStates.SCROLLABLE);
    } else {
      this.internals.states.delete(CarouselViewStates.SCROLLABLE);
    }
  }

  get scrollable() {
    return this.contents.scrollWidth > this.contents.clientWidth;
  }

  private scrollFrame(timestamp: DOMHighResTimeStamp) {
    if (this.scrollSpeed === 0) {
      this.contents.classList.remove("scrolling");
      return;
    }

    if (!this.lastScrollFrame) {
      this.lastScrollFrame = timestamp;
    }

    const elapsed = timestamp - this.lastScrollFrame;
    const distance = this.scrollSpeed * (elapsed / 1000) * 200;
    if (Math.abs(distance) > 1) {
      this.contents.scrollBy({
        left: distance,
        behavior: "instant",
      });
      this.lastScrollFrame = timestamp;
    }

    requestAnimationFrame(this.scrollFrame.bind(this));
  }
}

customElements.define("carousel-view", CarouselView);
