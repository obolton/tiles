import css from "./PageItem.css?inline";
import { PageItemEvent } from "@/elements/item/events";
import { DEFAULT_TIMING } from "@/utils/animation/effects";
import { makeDraggable } from "@/utils/drag";
import type { GlobalHTMLAttributes } from "@/jsx/html-attributes";

const DRAG_THRESHOLD = 10;

const stylesheet = new CSSStyleSheet();
stylesheet.replaceSync(css);

export type ResizeDirection = "all" | "horizontal" | "vertical";
export type ResizeHandleDirection =
  | "nw"
  | "n"
  | "ne"
  | "e"
  | "se"
  | "s"
  | "sw"
  | "w";

export interface PageItemAttributes extends GlobalHTMLAttributes {
  allowdrag?: boolean;
  resize?: ResizeDirection | null;
}

declare global {
  interface HTMLElementTagNameMap {
    "page-item": PageItem;
  }
}

declare module "@/jsx/html-attributes" {
  interface HTMLAttributesByTagName {
    "page-item": PageItemAttributes;
  }
}

export default class PageItem extends HTMLElement {
  static readonly observedAttributes: (keyof PageItemAttributes)[] = [
    "allowdrag",
    "resize",
  ] as const;

  #resize: ResizeDirection | null = null;

  private readonly internals: ElementInternals;

  private dragAbortController: AbortController | null = null;
  private resizeHandles: Map<ResizeHandleDirection, HTMLElement> = new Map();
  private outline: HTMLElement | null = null;

  private isResizing = false;
  private resizeAbortController?: AbortController;
  private resizeDirection: ResizeHandleDirection | null = null;
  private resizeRect = new DOMRect();
  private aspectRatio: number | null = null;
  private initialPointerX = 0;
  private initialPointerY = 0;

  get resize() {
    return this.#resize;
  }

  set resize(value: ResizeDirection | null) {
    if (value === this.#resize) {
      return;
    }

    this.#resize = value;

    if (!value) {
      this.endResizing();
      this.hideResizeHandles();
    } else {
      this.showResizeHandles();
    }
  }

  constructor() {
    super();

    this.internals = this.attachInternals();

    const shadow = this.attachShadow({ mode: "open" });
    shadow.adoptedStyleSheets = [stylesheet];
    shadow.append(document.createElement("slot"));
  }

  attributeChangedCallback(
    name: keyof PageItemAttributes,
    _: string | null,
    value: string | null,
  ) {
    switch (name) {
      case "resize":
        if (
          typeof value === "string" &&
          value !== "all" &&
          value !== "horizontal" &&
          value !== "vertical"
        ) {
          throw new Error(`Invalid value for resize attribute: ${value}`);
        }

        this.resize = value;
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

  private showResizeHandles() {
    // Remove existing handles first
    this.hideResizeHandles();

    const directions: ResizeHandleDirection[] =
      this.resize === "all"
        ? ["nw", "n", "ne", "e", "se", "s", "sw", "w"]
        : this.resize === "horizontal"
          ? ["e", "w"]
          : this.resize === "vertical"
            ? ["n", "s"]
            : [];

    for (const direction of directions) {
      const handle = document.createElement("div");
      handle.className = `resize resize-${direction}`;
      handle.dataset.direction = direction;
      handle.tabIndex = 0;
      handle.addEventListener("pointerdown", this.pointerDown.bind(this), {
        passive: false,
      });
      this.shadowRoot?.append(handle);
      this.resizeHandles.set(direction, handle);
    }
  }

  private hideResizeHandles() {
    for (const handle of this.resizeHandles.values()) {
      handle.remove();
    }
    this.resizeHandles.clear();
  }

  private pointerDown(event: PointerEvent) {
    event.stopPropagation();

    // Capture which handle was clicked
    const target = event.target as HTMLElement;
    this.resizeDirection =
      (target.dataset.direction as ResizeHandleDirection) || null;

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
    const direction = this.resizeDirection;

    if (this.isResizing) {
      const rect = this.getBoundingClientRect();

      this.resizeRect.x = rect.x;
      this.resizeRect.y = rect.y;

      // Calculate new dimensions and position based on resize direction
      switch (direction) {
        case "se": // Bottom-right (default behavior)
          this.resizeRect.width = event.clientX - rect.x;
          this.resizeRect.height = event.clientY - rect.y;
          break;
        case "nw": // Top-left
          this.resizeRect.width = rect.right - event.clientX;
          this.resizeRect.height = rect.bottom - event.clientY;
          this.resizeRect.x = event.clientX;
          this.resizeRect.y = event.clientY;
          break;
        case "ne": // Top-right
          this.resizeRect.width = event.clientX - rect.x;
          this.resizeRect.height = rect.bottom - event.clientY;
          this.resizeRect.y = event.clientY;
          break;
        case "sw": // Bottom-left
          this.resizeRect.width = rect.right - event.clientX;
          this.resizeRect.height = event.clientY - rect.y;
          this.resizeRect.x = event.clientX;
          break;
        case "n": // Top edge
          this.resizeRect.height = rect.bottom - event.clientY;
          this.resizeRect.y = event.clientY;
          break;
        case "e": // Right edge
          this.resizeRect.width = event.clientX - rect.x;
          break;
        case "s": // Bottom edge
          this.resizeRect.height = event.clientY - rect.y;
          break;
        case "w": // Left edge
          this.resizeRect.width = rect.right - event.clientX;
          this.resizeRect.x = event.clientX;
          break;
      }

      this.dispatchEvent(
        new PageItemEvent("itemresize", {
          bubbles: true,
          cancelable: false,
          rect: this.resizeRect,
          direction,
          clientX: event.clientX,
          clientY: event.clientY,
          altKey: event.altKey,
        }),
      );

      this.updateOutlineSize();
    } else {
      // Check drag threshold based on resize direction
      let deltaX = 0;
      let deltaY = 0;

      switch (direction) {
        case "e":
        case "w":
          deltaX = event.clientX - this.initialPointerX;
          break;
        case "n":
        case "s":
          deltaY = event.clientY - this.initialPointerY;
          break;
        case "ne":
        case "nw":
        case "se":
        case "sw":
          deltaX = event.clientX - this.initialPointerX;
          deltaY = event.clientY - this.initialPointerY;
          break;
      }

      const distance = Math.hypot(deltaX, deltaY);

      if (distance >= DRAG_THRESHOLD) {
        this.startResizing(event);
      }
    }
  }

  private pointerUp(event: PointerEvent) {
    if (this.isResizing) {
      this.dispatchEvent(
        new PageItemEvent("itemresizeend", {
          bubbles: true,
          cancelable: false,
          rect: this.resizeRect,
          direction: this.resizeDirection,
          clientX: event.clientX,
          clientY: event.clientY,
          altKey: event.altKey,
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

    const rect = this.getBoundingClientRect();
    this.initialPointerX = event.clientX;
    this.initialPointerY = event.clientY;
    this.resizeRect.x = rect.x;
    this.resizeRect.y = rect.y;
    this.resizeRect.width = rect.width;
    this.resizeRect.height = rect.height;

    const allowResize = this.dispatchEvent(
      new PageItemEvent("itemresizestart", {
        bubbles: true,
        cancelable: true,
        rect: this.resizeRect,
        direction: this.resizeDirection,
        clientX: event.clientX,
        clientY: event.clientY,
        altKey: event.altKey,
      }),
    );

    if (!allowResize) {
      return;
    }

    this.isResizing = true;
    const computedRatio = getComputedStyle(this).aspectRatio;
    this.aspectRatio =
      computedRatio === "auto" ? null : parseFloat(computedRatio);
    this.internals.states.add("resizing");
    this.showOutline();
  }

  private endResizing() {
    if (!this.isResizing) {
      return;
    }

    this.isResizing = false;
    this.resizeAbortController?.abort();
    this.resizeAbortController = undefined;
    this.internals.states.delete("resizing");
    this.removeOutline();
    this.focus({ preventScroll: true });
  }

  private showOutline() {
    if (this.outline) {
      return;
    }

    this.outline = document.createElement("div");
    this.outline.id = "outline";
    this.outline.setAttribute("part", "outline");
    if (
      this.aspectRatio !== null &&
      (this.resizeDirection === "n" || this.resizeDirection === "s")
    ) {
      this.outline.style.height = this.resizeRect.height + "px";
    } else {
      this.outline.style.width = this.resizeRect.width + "px";
      if (this.aspectRatio === null) {
        this.outline.style.height = this.resizeRect.height + "px";
      }
    }

    // Move all resize handles into the outline
    this.outline.append(...this.resizeHandles.values());

    this.shadowRoot?.appendChild(this.outline);

    // Focus the active resize handle and mark others as inactive
    const activeHandle = this.resizeDirection
      ? this.resizeHandles.get(this.resizeDirection)
      : null;

    for (const handle of this.resizeHandles.values()) {
      if (handle !== activeHandle) {
        handle.classList.add("inactive");
      }
    }

    activeHandle?.focus({ preventScroll: true });
  }

  private updateOutlineSize() {
    if (this.outline) {
      const rect = this.getBoundingClientRect();
      const offsetX = this.resizeRect.x - rect.x;
      const offsetY = this.resizeRect.y - rect.y;

      this.outline.style.left = offsetX + "px";
      this.outline.style.top = offsetY + "px";
      if (
        this.aspectRatio !== null &&
        (this.resizeDirection === "n" || this.resizeDirection === "s")
      ) {
        this.outline.style.height = this.resizeRect.height + "px";
      } else {
        this.outline.style.width = this.resizeRect.width + "px";
        if (this.aspectRatio === null) {
          this.outline.style.height = this.resizeRect.height + "px";
        }
      }
    }
  }

  private removeOutline() {
    for (const handle of this.resizeHandles.values()) {
      handle.classList.remove("inactive");
    }

    // Move all resize handles back to shadowRoot
    this.shadowRoot?.append(...this.resizeHandles.values());

    void this.outline
      ?.animate([{ opacity: 0 }], {
        ...DEFAULT_TIMING,
        fill: "forwards",
      })
      .finished.finally(() => {
        this.outline?.remove();
        this.outline = null;
      });
  }
}

customElements.define("page-item", PageItem);
