import css from "./PageItem.css?inline";
import { TileResizeEvent, TileEvent } from "@/utils/events";
import { DEFAULT_TIMING } from "@/utils/animation/effects";
import { makeDraggable } from "@/utils/drag";

const DRAG_THRESHOLD = 10;

const stylesheet = new CSSStyleSheet();
stylesheet.replaceSync(css);

export interface PageItemAttributes {
  allowdrag?: boolean;
  allowresize?: boolean;
  allowdelete?: boolean;
}

export default class PageItem extends HTMLElement {
  static readonly observedAttributes: (keyof PageItemAttributes)[] = [
    "allowdrag",
    "allowresize",
  ] as const;

  private readonly internals: ElementInternals;

  private dragAbortController: AbortController | null = null;
  private outline?: HTMLElement;

  private isResizing = false;
  private resizeAbortController?: AbortController;
  private width = 0;
  private height = 0;
  private initialPointerX = 0;
  private initialPointerY = 0;
  private maxX = 0;

  constructor() {
    super();

    this.internals = this.attachInternals();

    const shadow = this.attachShadow({ mode: "open", delegatesFocus: true });
    shadow.adoptedStyleSheets = [stylesheet];
    shadow.append(document.createElement("slot"));

    this.addEventListener("keydown", this);
  }

  attributeChangedCallback(
    name: keyof PageItemAttributes,
    _: string,
    value: string | null,
  ) {
    switch (name) {
      case "allowresize":
        if (value === null) {
          this.endResizing();
          this.hideResizeHandle();
        } else {
          this.showResizeHandle();
        }
        break;

      case "allowdrag":
        if (value === null) {
          this.hideDragHandle();
        } else {
          this.showDragHandle();
        }
        break;
    }
  }

  disconnectedCallback() {
    this.endResizing();
  }

  handleEvent(event: Event) {
    switch (event.type) {
      case "keydown":
        return this.handleKeyDown(event as KeyboardEvent);
    }
  }

  private handleKeyDown(event: KeyboardEvent) {
    const { target, key } = event;
    if (
      (key === "Backspace" || key === "Delete") &&
      target instanceof HTMLElement &&
      target.tagName !== "INPUT" &&
      target.tagName !== "TEXTAREA" &&
      !target.isContentEditable &&
      this.hasAttribute("allowdelete")
    ) {
      event.preventDefault();
      event.stopPropagation();
      this.delete();
    }
  }

  private showDragHandle() {
    if (this.shadowRoot?.getElementById("drag")) {
      return;
    }

    const handle = document.createElement("div");
    handle.id = "drag";
    this.shadowRoot?.prepend(handle);
    this.dragAbortController = new AbortController();
    makeDraggable(this, { handle, signal: this.dragAbortController.signal });
  }

  private hideDragHandle() {
    this.shadowRoot?.getElementById("drag")?.remove();
    this.dragAbortController?.abort();
    this.dragAbortController = null;
  }

  private showResizeHandle() {
    if (this.shadowRoot?.getElementById("resize")) {
      return;
    }

    const handle = document.createElement("div");
    handle.id = "resize";
    handle.tabIndex = 0;
    handle.addEventListener("pointerdown", this.pointerDown.bind(this), {
      passive: false,
    });
    this.shadowRoot?.append(handle);
  }

  private hideResizeHandle() {
    this.shadowRoot?.getElementById("resize")?.remove();
  }

  private pointerDown(event: PointerEvent) {
    event.preventDefault();
    event.stopPropagation();

    this.resizeAbortController = new AbortController();
    const signal = this.resizeAbortController.signal;

    window.addEventListener("pointermove", this.pointerMove.bind(this), {
      passive: true,
      signal,
    });
    window.addEventListener("pointerup", this.pointerUp.bind(this), {
      passive: true,
      signal,
    });
    window.addEventListener("keydown", this.keyDown.bind(this), {
      passive: false,
      signal,
    });
    window.addEventListener("touchmove", this.touchMove.bind(this), {
      passive: false,
      signal,
    });
  }

  private pointerMove(event: PointerEvent) {
    if (this.isResizing) {
      this.width = Math.min(event.pageX, this.maxX) - this.initialPointerX;
      this.height = event.pageY - this.initialPointerY;

      this.dispatchEvent(
        new TileResizeEvent("tileresize", {
          bubbles: true,
          cancelable: true,
          width: this.width,
          height: this.height,
        }),
      );

      this.updateOutlineSize();
    } else {
      const deltaX = event.pageX - this.initialPointerX;
      const deltaY = event.pageY - this.initialPointerY;
      const distance = Math.hypot(deltaX, deltaY);

      if (distance >= DRAG_THRESHOLD) {
        this.startResizing(event);
      }
    }
  }

  private pointerUp() {
    if (this.isResizing) {
      this.dispatchEvent(
        new TileResizeEvent("tileresizeend", {
          bubbles: true,
          cancelable: false,
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

  private startResizing(event: PointerEvent) {
    if (this.isResizing) {
      throw new Error("Already resizing");
    }

    const bounds = this.getBoundingClientRect();
    this.initialPointerX = bounds.x + window.scrollX;
    this.initialPointerY = bounds.y + window.scrollY;
    this.width = event.pageX - this.initialPointerX;
    this.height = event.pageY - this.initialPointerY;

    const parentBounds = this.offsetParent?.getBoundingClientRect();
    this.maxX = parentBounds?.right ?? Infinity;

    const allowResize = this.dispatchEvent(
      new TileResizeEvent("tileresizestart", {
        bubbles: true,
        cancelable: true,
        width: this.width,
        height: this.height,
      }),
    );

    if (!allowResize) {
      return;
    }

    this.isResizing = true;
    this.internals.states.add("resizing");
    this.showOutline();
  }

  private endResizing() {
    this.isResizing = false;
    this.resizeAbortController?.abort();
    this.resizeAbortController = undefined;
    this.internals.states.delete("resizing");
    this.removeOutline();
  }

  private showOutline() {
    if (this.outline) {
      return;
    }

    this.outline = document.createElement("div");
    this.outline.id = "outline";
    this.outline.setAttribute("part", "outline");
    this.outline.style.width = `${this.width}px`;
    this.outline.style.height = `${this.height}px`;
    this.shadowRoot?.appendChild(this.outline);

    this.outline.animate([{ opacity: 0 }, { opacity: 1 }], {
      ...DEFAULT_TIMING,
      fill: "forwards",
    });
  }

  private updateOutlineSize() {
    if (this.outline) {
      this.outline.style.width = `${this.width}px`;
      this.outline.style.height = `${this.height}px`;
    }
  }

  private removeOutline() {
    this.outline
      ?.animate([{ opacity: 0 }], {
        ...DEFAULT_TIMING,
        fill: "forwards",
      })
      .addEventListener("finish", () => {
        this.outline?.remove();
        this.outline = undefined;
      });
  }

  delete() {
    this.dispatchEvent(
      new TileEvent("tiledelete", {
        bubbles: true,
        cancelable: true,
      }),
    );
  }
}

customElements.define("page-item", PageItem);
