import css from "./ResizeItem.css?inline";
import { ResizeEvent } from "@/utils/resize";

const DRAG_THRESHOLD = 10;

const stylesheet = new CSSStyleSheet();
stylesheet.replaceSync(css);

export default class ResizeItem extends HTMLElement {
  static readonly observedAttributes = ["disabled"] as const;

  protected readonly internals: ElementInternals;

  private handle: HTMLElement | null = null;
  private outline: HTMLElement | null = null;
  private origin: DOMPoint | null = null;
  private initialPointerLocation: { x: number; y: number } | null = null;
  private abortController: AbortController | null = null;
  private isResizing = false;
  private width = 0;
  private height = 0;

  constructor() {
    super();

    this.internals = this.attachInternals();

    const shadow = this.attachShadow({ mode: "open", delegatesFocus: true });
    shadow.adoptedStyleSheets = [stylesheet];
    shadow.append(document.createElement("slot"));
  }

  connectedCallback() {
    if (!this.hasAttribute("disabled")) {
      this.showHandle();
    }
  }

  attributeChangedCallback(
    name: (typeof ResizeItem.observedAttributes)[number],
    _: string,
    value: string,
  ) {
    switch (name) {
      case "disabled":
        if (value) {
          this.endResizing();
          this.hideHandle();
        } else {
          this.showHandle();
        }
    }
  }

  disconnectedCallback() {
    this.endResizing();
  }

  private showHandle() {
    if (this.handle) {
      return;
    }

    this.handle = document.createElement("div");
    this.handle.classList.add("handle");
    this.handle.addEventListener("pointerdown", this.pointerDown.bind(this), {
      passive: false,
    });
    this.shadowRoot?.append(this.handle);
  }

  private hideHandle() {
    this.handle?.remove();
    this.handle = null;
  }

  private pointerDown(event: PointerEvent) {
    event.preventDefault();
    event.stopPropagation();

    this.initialPointerLocation = { x: event.pageX, y: event.pageY };

    this.abortController = new AbortController();

    window.addEventListener("pointermove", this.pointerMove.bind(this), {
      passive: true,
      signal: this.abortController.signal,
    });
    window.addEventListener("pointerup", this.pointerUp.bind(this), {
      passive: true,
      signal: this.abortController.signal,
    });
    window.addEventListener("keydown", this.keyDown.bind(this), {
      passive: false,
      signal: this.abortController.signal,
    });
    window.addEventListener("touchmove", this.touchMove.bind(this), {
      passive: false,
      signal: this.abortController.signal,
    });
  }

  private pointerMove(event: PointerEvent) {
    if (this.isResizing) {
      this.width = event.pageX - (this.origin?.x ?? 0);
      this.height = event.pageY - (this.origin?.y ?? 0);

      this.dispatchEvent(
        new ResizeEvent("resize:resize", {
          width: this.width,
          height: this.height,
        }),
      );

      this.resizeOutline();
    } else {
      const deltaX = event.pageX - (this.initialPointerLocation?.x ?? 0);
      const deltaY = event.pageY - (this.initialPointerLocation?.y ?? 0);
      const distance = Math.hypot(deltaX, deltaY);

      if (distance >= DRAG_THRESHOLD) {
        this.startResizing(event.pageX, event.pageY);
      }
    }
  }

  private pointerUp() {
    if (this.isResizing) {
      this.dispatchEvent(
        new ResizeEvent("resize:end", {
          width: this.width,
          height: this.height,
        }),
      );
    }

    this.endResizing();
  }

  private keyDown(event: KeyboardEvent) {
    if (event.key === "Escape" && this.isResizing) {
      event.preventDefault();
      event.stopPropagation();
      this.endResizing();
    }
  }

  private touchMove(event: TouchEvent) {
    // Disable scrolling while dragging with touch
    event.preventDefault();
  }

  private startResizing(pageX: number, pageY: number) {
    if (this.isResizing) {
      throw new Error("Resize already in progress");
    }

    this.isResizing = true;
    this.internals.states.add("resizing");

    const bounds = this.getBoundingClientRect();
    this.origin = new DOMPoint(
      bounds.x + window.scrollX,
      bounds.y + window.scrollY,
    );
    this.width = pageX - this.origin.x;
    this.height = pageY - this.origin.y;

    this.showOutline();
  }

  private endResizing() {
    this.abortController?.abort();
    this.abortController = null;
    this.isResizing = false;
    this.origin = null;
    this.initialPointerLocation = null;
    this.internals.states.delete("resizing");
    this.removeOutline();
  }

  private showOutline() {
    if (this.outline) {
      return;
    }

    this.outline = document.createElement("div");
    this.outline.className = "outline";
    this.outline.style.setProperty("width", `${this.width}px`);
    this.outline.style.setProperty("height", `${this.height}px`);
    this.shadowRoot?.appendChild(this.outline);
    this.outline.animate([{ opacity: 0 }, { opacity: 0.8 }], {
      duration: 200,
      easing: "ease",
      fill: "forwards",
    });
  }

  private removeOutline() {
    this.outline
      ?.animate([{ opacity: 0 }], {
        duration: 200,
        easing: "ease",
        fill: "forwards",
      })
      .addEventListener("finish", () => {
        this.outline?.remove();
        this.outline = null;
      });
  }

  private resizeOutline() {
    requestAnimationFrame(() => {
      this.outline?.style.setProperty("width", `${this.width}px`);
      this.outline?.style.setProperty("height", `${this.height}px`);
    });
  }
}
