import css from "./ItemHandle.css?inline";
import { PageItemEvent } from "@/elements/item/events";
import { getResizeHandleDirections, type ResizeHandleDirection } from "@/elements/item/resize";
import { makeDraggable } from "@/utils/drag";
import { trackAnchor } from "@/utils/anchor";
import type { GlobalHTMLAttributes } from "@/jsx/html-attributes";

const DRAG_THRESHOLD = 10;

const stylesheet = new CSSStyleSheet();
stylesheet.replaceSync(css);

export interface ItemHandleAttributes extends GlobalHTMLAttributes {
  target?: string;
  resize?: string | null;
  allowdrag?: boolean;
}

declare global {
  interface HTMLElementTagNameMap {
    "item-handle": ItemHandle;
  }
}

declare module "@/jsx/html-attributes" {
  interface HTMLAttributesByTagName {
    "item-handle": ItemHandleAttributes;
  }
}

export default class ItemHandle extends HTMLElement {
  static readonly observedAttributes: (keyof ItemHandleAttributes)[] = [
    "target",
    "resize",
    "allowdrag",
  ] as const;

  #target: HTMLElement | null = null;

  private readonly internals: ElementInternals;
  private drag: HTMLElement | null = null;
  private readonly resizeHandles = new Map<ResizeHandleDirection, HTMLElement>();

  private dragAbortController: AbortController | null = null;
  private trackingAbortController: AbortController | null = null;
  private resizeAbortController: AbortController | null = null;

  private isResizing = false;
  private resizeDirection: ResizeHandleDirection | null = null;
  private resizeRect = new DOMRect();
  private initialPointerX = 0;
  private initialPointerY = 0;

  constructor() {
    super();

    this.internals = this.attachInternals();

    const shadow = this.attachShadow({ mode: "open" });
    shadow.adoptedStyleSheets = [stylesheet];
  }

  get target(): HTMLElement | null {
    return this.#target;
  }

  set target(element: HTMLElement | null) {
    if (element === this.#target) {
      return;
    }
    this.#target = element;
    this.bindTarget();
  }

  get resize(): string | null {
    return this.getAttribute("resize");
  }

  set resize(value: string | null) {
    if (value === this.resize) {
      return;
    }
    if (value) {
      this.setAttribute("resize", value);
    } else {
      this.removeAttribute("resize");
    }
  }

  get allowDrag(): boolean {
    return this.hasAttribute("allowdrag");
  }

  set allowDrag(value: boolean) {
    if (value === this.allowDrag) {
      return;
    }
    this.toggleAttribute("allowdrag", value);
  }

  connectedCallback() {
    this.popover = "manual";
    this.present();
  }

  disconnectedCallback() {
    this.endResizing();
    this.dismiss();
    this.dragAbortController?.abort();
    this.dragAbortController = null;
  }

  attributeChangedCallback(
    name: keyof ItemHandleAttributes,
    _: string | null,
    value: string | null,
  ) {
    switch (name) {
      case "target": {
        const element = value ? document.getElementById(value) : null;
        if (element !== this.#target) {
          this.#target = element;
          this.bindTarget();
        }
        break;
      }
      case "resize":
        if (!this.resize) {
          this.endResizing();
        }
        this.renderResizeHandles();
        break;
      case "allowdrag":
        this.renderDragHandle();
        break;
    }
  }

  handleEvent(event: Event) {
    switch (event.type) {
      case "pointerdown":
        return this.pointerDown(event as PointerEvent);
      case "pointermove":
        return this.pointerMove(event as PointerEvent);
      case "pointerup":
        return this.pointerUp(event as PointerEvent);
      case "keydown":
        return this.keyDown(event as KeyboardEvent);
      case "touchmove":
        // Disable scrolling while resizing with touch
        return event.preventDefault();
      case "dnd-dragstart":
        this.internals.states.add("dragging");
        return;
      case "dnd-dragend":
        this.internals.states.delete("dragging");
        return;
    }
  }

  private bindTarget() {
    // (Re)wire dragging against the (possibly new) target.
    this.renderDragHandle();

    if (this.isConnected) {
      this.dismiss();
      this.present();
    }
  }

  private renderDragHandle() {
    this.dragAbortController?.abort();
    this.dragAbortController = null;
    this.drag?.remove();
    this.drag = null;

    if (!this.allowDrag || !this.#target) {
      return;
    }

    this.drag = document.createElement("div");
    this.drag.id = "drag";
    this.shadowRoot?.prepend(this.drag);

    this.dragAbortController = new AbortController();
    makeDraggable(this.#target, {
      handle: this.drag,
      signal: this.dragAbortController.signal,
    });
  }

  private renderResizeHandles() {
    for (const handle of this.resizeHandles.values()) {
      handle.remove();
    }
    this.resizeHandles.clear();

    for (const direction of getResizeHandleDirections(this.resize)) {
      const handle = document.createElement("div");
      handle.className = `resize resize-${direction}`;
      handle.dataset.direction = direction;
      handle.tabIndex = 0;
      handle.addEventListener("pointerdown", this, { passive: false });
      this.shadowRoot?.append(handle);
      this.resizeHandles.set(direction, handle);
    }
  }

  // Presentation lifecycle

  private present() {
    if (this.trackingAbortController || !this.isConnected || !this.#target) {
      return;
    }

    this.showPopover();

    this.trackingAbortController = new AbortController();
    const { signal } = this.trackingAbortController;
    trackAnchor(this, this.#target, { signal });
    this.#target.addEventListener("dnd-dragstart", this, { signal });
    this.#target.addEventListener("dnd-dragend", this, { signal });
  }

  private dismiss() {
    if (!this.trackingAbortController) {
      return;
    }

    this.trackingAbortController.abort();
    this.trackingAbortController = null;
    this.hidePopover();
  }

  // Resize gesture

  private pointerDown(event: PointerEvent) {
    event.stopPropagation();

    const target = event.target as HTMLElement;
    this.resizeDirection = (target.dataset.direction as ResizeHandleDirection) || null;

    this.resizeAbortController = new AbortController();
    const signal = this.resizeAbortController.signal;

    window.addEventListener("pointermove", this, { passive: true, signal });
    window.addEventListener("pointerup", this, { passive: true, signal });
    window.addEventListener("keydown", this, { passive: false, signal });
    window.addEventListener("touchmove", this, { passive: false, signal });
  }

  private pointerMove(event: PointerEvent) {
    const direction = this.resizeDirection;

    if (this.isResizing) {
      const rect = this.#target?.getBoundingClientRect();
      if (!rect) {
        return;
      }

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
          composed: true,
          rect: this.resizeRect,
          direction,
          clientX: event.clientX,
          clientY: event.clientY,
          altKey: event.altKey,
        }),
      );
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
          composed: true,
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

  private startResizing(event: PointerEvent) {
    if (this.isResizing) {
      throw new Error("Already resizing");
    }

    const target = this.#target;
    if (!target) {
      return;
    }

    const rect = target.getBoundingClientRect();
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
        composed: true,
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
    this.internals.states.add("resizing");

    // Focus the active resize handle and mark the others as inactive.
    const activeHandle = this.resizeDirection ? this.resizeHandles.get(this.resizeDirection) : null;

    for (const handle of this.resizeHandles.values()) {
      if (handle !== activeHandle) {
        handle.classList.add("inactive");
      }
    }

    activeHandle?.focus({ preventScroll: true });
  }

  private endResizing() {
    if (!this.isResizing) {
      return;
    }

    this.isResizing = false;
    this.resizeAbortController?.abort();
    this.resizeAbortController = null;
    this.internals.states.delete("resizing");

    for (const handle of this.resizeHandles.values()) {
      handle.classList.remove("inactive");
    }

    this.#target?.focus({ preventScroll: true });
  }
}

customElements.define("item-handle", ItemHandle);
