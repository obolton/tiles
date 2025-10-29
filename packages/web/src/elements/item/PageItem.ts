import css from "./PageItem.css?inline";
import { PageItemEvent } from "@/elements/item/events";
import { DEFAULT_TIMING } from "@/utils/animation/effects";
import { makeDraggable } from "@/utils/drag";

const DRAG_THRESHOLD = 10;

const stylesheet = new CSSStyleSheet();
stylesheet.replaceSync(css);

export type ResizeDirection = "all" | "horizontal" | "vertical";

export interface PageItemAttributes {
  allowdrag?: boolean;
  resize?: ResizeDirection | null;
}

declare global {
  interface HTMLElementTagNameMap {
    "page-item": PageItem;
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
  private resizeHandle: HTMLElement | null = null;
  private outline: HTMLElement | null = null;

  private isResizing = false;
  private resizeAbortController?: AbortController;
  private width = 0;
  private height = 0;
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
      this.hideResizeHandle();
    } else {
      if (this.resizeHandle) {
        this.resizeHandle.className = value;
      } else {
        this.showResizeHandle();
      }
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

  private showResizeHandle() {
    if (this.resizeHandle) {
      return;
    }

    this.resizeHandle = document.createElement("div");
    this.resizeHandle.id = "resize";
    this.resizeHandle.className = this.resize ?? "all";
    this.resizeHandle.tabIndex = 0;
    this.resizeHandle.addEventListener(
      "pointerdown",
      this.pointerDown.bind(this),
      {
        passive: false,
      },
    );
    this.shadowRoot?.append(this.resizeHandle);
  }

  private hideResizeHandle() {
    this.resizeHandle?.remove();
    this.resizeHandle = null;
  }

  private pointerDown(event: PointerEvent) {
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
    const horizontal = this.resize === "all" || this.resize === "horizontal";
    const vertical = this.resize === "all" || this.resize === "vertical";

    if (this.isResizing) {
      const rect = this.getBoundingClientRect();
      this.width = horizontal ? event.clientX - rect.x : rect.width;
      this.height = vertical ? event.clientY - rect.y : rect.height;

      this.dispatchEvent(
        new PageItemEvent("itemresize", {
          bubbles: true,
          cancelable: false,
          width: this.width,
          height: this.height,
        }),
      );

      this.updateOutlineSize();
    } else {
      const deltaX = horizontal ? event.clientX - this.initialPointerX : 0;
      const deltaY = vertical ? event.clientY - this.initialPointerY : 0;
      const distance = Math.hypot(deltaX, deltaY);

      if (distance >= DRAG_THRESHOLD) {
        this.startResizing(event);
      }
    }
  }

  private pointerUp() {
    if (this.isResizing) {
      this.dispatchEvent(
        new PageItemEvent("itemresizeend", {
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

    const rect = this.getBoundingClientRect();
    this.initialPointerX = event.clientX;
    this.initialPointerY = event.clientY;
    this.width = rect.width;
    this.height = rect.height;

    const allowResize = this.dispatchEvent(
      new PageItemEvent("itemresizestart", {
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
    this.outline.style.width = this.width + "px";
    this.outline.style.height = this.height + "px";
    if (this.resizeHandle) {
      this.outline.appendChild(this.resizeHandle);
    }
    this.shadowRoot?.appendChild(this.outline);
    this.resizeHandle?.focus({ preventScroll: true });
  }

  private updateOutlineSize() {
    if (this.outline) {
      this.outline.style.width = this.width + "px";
      this.outline.style.height = this.height + "px";
    }
  }

  private removeOutline() {
    if (this.resizeHandle) {
      this.shadowRoot?.appendChild(this.resizeHandle);
    }
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
