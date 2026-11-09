import arrowLeftIcon from "@/icons/arrow-left.svg?raw";
import arrowRightIcon from "@/icons/arrow-right.svg?raw";
import closeIcon from "@/icons/close.svg?raw";
import fullscreenIcon from "@/icons/fullscreen.svg?raw";
import "./presentation.css";

const IDLE_TIMEOUT = 3000;

/** Slides step through the root items one screen at a time; a page is shown whole. */
export type PresentationMode = "slides" | "page";

interface SlideNavigation {
  group: HTMLElement;
  prevButton: HTMLButtonElement;
  nextButton: HTMLButtonElement;
  counter: HTMLElement;
}

export default class Presentation {
  static #current: Presentation | null = null;

  static start(container?: HTMLElement, startSlide = 0) {
    if (this.#current) {
      return;
    }

    const element = container ?? document.querySelector("main");

    if (!(element instanceof HTMLElement)) {
      return;
    }

    const mode: PresentationMode = element.dataset.pageType === "LAYOUT" ? "page" : "slides";

    if (mode === "slides" && element.children.length === 0) {
      return;
    }

    this.#current = new Presentation(element, mode, startSlide);
  }

  static stop() {
    this.#current?.destroy();
    this.#current = null;
  }

  static get isActive() {
    return this.#current !== null;
  }

  private readonly container: HTMLElement;
  private readonly mode: PresentationMode;
  private readonly toolbar: HTMLElement;
  private readonly navigation: SlideNavigation | null;
  private readonly fullscreenButton: HTMLButtonElement;
  private readonly abortController = new AbortController();

  private currentIndex: number;
  private activeSlide: HTMLElement | null = null;
  private idleTimer = 0;
  private togglingFullscreen = false;

  private get slideCount() {
    return this.container.children.length;
  }

  private constructor(container: HTMLElement, mode: PresentationMode, startSlide: number) {
    this.container = container;
    this.mode = mode;
    this.currentIndex = Math.max(0, Math.min(startSlide, this.slideCount - 1));

    this.toolbar = document.createElement("floating-toolbar");
    this.toolbar.id = "presentation-toolbar";
    this.toolbar.className = "primary";
    this.toolbar.setAttribute("aria-label", "Presentation controls");
    this.toolbar.dataset.tooltipPosition = "top";

    const tab = document.createElement("toolbar-tab");

    this.navigation = mode === "slides" ? this.createNavigation() : null;
    if (this.navigation) {
      tab.append(this.navigation.group);
    }

    const controlGroup = document.createElement("div");
    controlGroup.role = "group";
    controlGroup.ariaLabel = "Controls";
    this.fullscreenButton = this.createButton("fullscreen", fullscreenIcon, "Fullscreen");
    this.fullscreenButton.append("Fullscreen");
    const closeButton = this.createButton("close", closeIcon, "Exit presentation");
    controlGroup.append(this.fullscreenButton, closeButton);

    tab.append(controlGroup);
    this.toolbar.append(tab);

    document.body.appendChild(this.toolbar);
    document.body.dataset.presenting = mode;

    // Move focus away from any now-hidden element so keyboard events work
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }

    this.addEventListeners();
    if (mode === "slides") {
      this.observeSlides();
      this.goTo(this.currentIndex);
    }
    void this.enterFullscreen();

    // Show toolbar initially, then auto-hide
    this.showControls();
    this.idleTimer = window.setTimeout(() => this.hideControls(), IDLE_TIMEOUT);
  }

  private destroy() {
    delete document.body.dataset.presenting;

    this.activeSlide?.classList.remove("slide-active");
    this.activeSlide = null;

    this.toolbar.remove();
    this.abortController.abort();
    clearTimeout(this.idleTimer);

    if (document.fullscreenElement) {
      void document.exitFullscreen();
    }

    const url = new URL(window.location.href);
    if (url.searchParams.has("present")) {
      url.searchParams.delete("present");
      history.replaceState(null, "", url);
    }
  }

  // Navigation

  private createNavigation(): SlideNavigation {
    const group = document.createElement("div");
    group.role = "group";
    group.ariaLabel = "Navigation";
    const prevButton = this.createButton("previous", arrowLeftIcon, "Previous slide");
    const counter = document.createElement("span");
    counter.className = "slide-counter";
    const nextButton = this.createButton("next", arrowRightIcon, "Next slide");
    group.append(prevButton, counter, nextButton);
    return { group, prevButton, nextButton, counter };
  }

  private goTo(index: number) {
    this.currentIndex = Math.max(0, Math.min(index, this.slideCount - 1));
    const slide = this.container.children[this.currentIndex];

    if (!(slide instanceof HTMLElement)) {
      return;
    }

    this.container.scrollTo({
      top: slide.offsetTop - this.container.offsetTop,
      behavior: "instant",
    });
    this.setActiveSlide(slide);
    this.updateProgress();
  }

  private next() {
    if (this.currentIndex < this.slideCount - 1) {
      this.goTo(this.currentIndex + 1);
    }
  }

  private previous() {
    if (this.currentIndex > 0) {
      this.goTo(this.currentIndex - 1);
    }
  }

  // Events

  handleEvent(event: Event) {
    switch (event.type) {
      case "keydown":
        this.onKeyDown(event as KeyboardEvent);
        break;
      case "pointermove":
        this.onPointerMove(event as PointerEvent);
        break;
      case "click":
        this.onClick(event);
        break;
      case "fullscreenchange":
        this.onFullscreenChange();
        break;
    }
  }

  private addEventListeners() {
    const { signal } = this.abortController;

    document.addEventListener("keydown", this, { signal });
    document.addEventListener("pointermove", this, { signal });
    document.addEventListener("fullscreenchange", this, { signal });
    this.toolbar.addEventListener("click", this, { signal });
  }

  private async enterFullscreen() {
    if (!document.fullscreenEnabled || !navigator.userActivation?.isActive) {
      return;
    }

    try {
      await document.documentElement.requestFullscreen();
      if (this.mode === "slides") {
        this.goTo(this.currentIndex);
      }
    } catch {
      // Fullscreen denied
    }
  }

  private onKeyDown(event: KeyboardEvent) {
    if (event.defaultPrevented) {
      return;
    }

    if (event.key === "Escape") {
      event.preventDefault();
      Presentation.stop();
      return;
    }

    // A whole page scrolls natively
    if (this.mode !== "slides") {
      return;
    }

    switch (event.key) {
      case "ArrowRight":
      case "ArrowDown":
      case " ":
      case "Enter":
      case "PageDown":
        event.preventDefault();
        this.next();
        break;
      case "ArrowLeft":
      case "ArrowUp":
      case "Backspace":
      case "PageUp":
        event.preventDefault();
        this.previous();
        break;
      case "Home":
        event.preventDefault();
        this.goTo(0);
        break;
      case "End":
        event.preventDefault();
        this.goTo(this.slideCount - 1);
        break;
    }
  }

  private onClick(event: Event) {
    const button =
      event.target instanceof Element ? event.target.closest<HTMLElement>("[data-action]") : null;

    switch (button?.dataset.action) {
      case "previous":
        this.previous();
        break;
      case "next":
        this.next();
        break;
      case "fullscreen":
        this.toggleFullscreen();
        break;
      case "close":
        Presentation.stop();
        break;
    }
  }

  private onPointerMove(event: PointerEvent) {
    this.showControls();
    clearTimeout(this.idleTimer);

    if (!this.toolbar.contains(event.target as Node)) {
      this.idleTimer = window.setTimeout(() => this.hideControls(), IDLE_TIMEOUT);
    }
  }

  private onFullscreenChange() {
    const isFullscreen = Boolean(document.fullscreenElement);
    this.fullscreenButton.ariaPressed = isFullscreen ? "true" : "false";

    if (!isFullscreen && !this.togglingFullscreen) {
      Presentation.stop();
    }
    this.togglingFullscreen = false;
  }

  private toggleFullscreen() {
    this.togglingFullscreen = true;
    if (document.fullscreenElement) {
      void document.exitFullscreen();
    } else if (document.fullscreenEnabled) {
      void document.documentElement.requestFullscreen();
    }
  }

  // Active slide tracking

  private setActiveSlide(slide: HTMLElement) {
    if (this.activeSlide === slide) {
      return;
    }
    this.activeSlide?.classList.remove("slide-active");
    slide.classList.add("slide-active");
    this.activeSlide = slide;

    // Replay entrance animations that may have already finished
    for (const element of slide.querySelectorAll(".animate")) {
      for (const animation of element.getAnimations()) {
        animation.play();
      }
    }
  }

  private observeSlides() {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting || entry.intersectionRatio <= 0.5) {
            continue;
          }

          const index = Array.prototype.indexOf.call(this.container.children, entry.target);

          if (index >= 0 && index !== this.currentIndex) {
            this.currentIndex = index;
            if (entry.target instanceof HTMLElement) {
              this.setActiveSlide(entry.target);
            }
            this.updateProgress();
          }
        }
      },
      { root: this.container, threshold: 0.5 },
    );

    for (const child of this.container.children) {
      observer.observe(child);
    }

    this.abortController.signal.addEventListener("abort", () => {
      observer.disconnect();
    });
  }

  // Toolbar

  private showControls() {
    this.toolbar.classList.add("visible");
  }

  private hideControls() {
    this.toolbar.classList.remove("visible");
  }

  private createButton(action: string, icon: string, label: string): HTMLButtonElement {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "floating";
    button.dataset.action = action;
    button.dataset.tooltip = label;
    button.innerHTML = icon;
    button.ariaLabel = label;
    return button;
  }

  private updateProgress() {
    if (!this.navigation) {
      return;
    }

    const { counter, prevButton, nextButton } = this.navigation;
    counter.textContent = `${this.currentIndex + 1} / ${this.slideCount}`;
    prevButton.disabled = this.currentIndex === 0;
    nextButton.disabled = this.currentIndex === this.slideCount - 1;

    const url = new URL(window.location.href);
    url.searchParams.set("present", String(this.currentIndex));
    history.replaceState(null, "", url);
  }
}
