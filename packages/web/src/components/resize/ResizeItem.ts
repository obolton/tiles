import css from "./ResizeItem.css?inline";
import { TileResizeEvent, TileEvent } from "@/utils/events";
import { DEFAULT_TIMING } from "@/utils/animation/effects";

const DRAG_THRESHOLD = 10;

const stylesheet = new CSSStyleSheet();
stylesheet.replaceSync(css);

export interface ResizeItemAttributes {
  allowresize?: "" | "allowresize";
}

export default class ResizeItem extends HTMLElement {
  static readonly observedAttributes: (keyof ResizeItemAttributes)[] = [
    "allowresize",
  ] as const;

  private readonly internals: ElementInternals;

  private resizeHandle?: HTMLElement;
  private outline?: HTMLElement;

  private isResizing = false;
  private resizeAbortController?: AbortController;
  private width = 0;
  private height = 0;
  private initialPointerX = 0;
  private initialPointerY = 0;

  constructor() {
    super();

    this.internals = this.attachInternals();

    const shadow = this.attachShadow({ mode: "open", delegatesFocus: true });
    shadow.adoptedStyleSheets = [stylesheet];
    shadow.append(document.createElement("slot"));
  }

  attributeChangedCallback(
    name: keyof ResizeItemAttributes,
    _: string,
    value: string | null,
  ) {
    switch (name) {
      case "allowresize":
        if (value === null) {
          this.endResizing();
          this.hideHandle();
        } else {
          this.showHandle();
        }
        break;
    }
  }

  disconnectedCallback() {
    this.endResizing();
  }

  private showHandle() {
    if (this.resizeHandle) {
      return;
    }

    this.resizeHandle = document.createElement("div");
    this.resizeHandle.id = "handle";
    this.resizeHandle.addEventListener(
      "pointerdown",
      this.pointerDown.bind(this),
      {
        passive: false,
      },
    );
    this.shadowRoot?.append(this.resizeHandle);
  }

  private hideHandle() {
    this.resizeHandle?.remove();
    this.resizeHandle = undefined;
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
      this.width = event.pageX - this.initialPointerX;
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

    this.outline.animate([{ opacity: 0 }, { opacity: 0.8 }], {
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
}
