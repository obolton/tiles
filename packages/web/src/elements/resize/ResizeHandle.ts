import { PRIMARY_MOUSE_BUTTON } from "@/constants/input";
import { ResizeEvent } from "./events";
import type { GlobalHTMLAttributes } from "jsx/html-attributes";

export type ResizeDirection = "horizontal" | "vertical";

export interface ResizeHandleAttributes extends GlobalHTMLAttributes {
  direction?: ResizeDirection;
}

declare global {
  interface HTMLElementTagNameMap {
    "resize-handle": ResizeHandle;
  }
}

declare module "jsx/html-attributes" {
  interface HTMLAttributesByTagName {
    "resize-handle": ResizeHandleAttributes;
  }
}

export default class ResizeHandle extends HTMLElement {
  static readonly observedAttributes: (keyof ResizeHandleAttributes)[] = ["direction"] as const;

  direction: ResizeDirection = "horizontal";

  private readonly internals: ElementInternals;
  private initialPageX = 0;
  private initialPageY = 0;
  private deltaX = 0;
  private deltaY = 0;

  get target(): Element | null {
    return this.internals.ariaControlsElements?.[0] ?? null;
  }

  set target(value: Element | null) {
    this.internals.ariaControlsElements = value ? [value] : null;
  }

  get resizing() {
    return this.internals.states.has("resizing");
  }

  set resizing(value: boolean) {
    if (value) {
      this.internals.states.add("resizing");
    } else {
      this.internals.states.delete("resizing");
    }
  }

  constructor() {
    super();

    this.internals = this.attachInternals();
  }

  connectedCallback() {
    this.addEventListener("pointerdown", this);
    if (this.resizing) {
      addEventListener("pointermove", this, { passive: true });
      addEventListener("pointerup", this);
    }
  }

  disconnectedCallback() {
    this.removeEventListener("pointerdown", this);
    removeEventListener("pointermove", this);
    removeEventListener("pointerup", this);
  }

  attributeChangedCallback(
    name: keyof ResizeHandleAttributes,
    _: string | null,
    value: string | null,
  ) {
    switch (name) {
      case "direction":
        if (value === "horizontal" || value === "vertical") {
          this.direction = value;
        } else {
          this.direction = "horizontal";
        }
        break;
    }
  }

  handleEvent(event: Event) {
    switch (event.type) {
      case "pointerdown":
        return this.handlePointerDown(event as PointerEvent);
      case "pointermove":
        return this.handlePointerMove(event as PointerEvent);
      case "pointerup":
        return this.handlePointerUp(event as PointerEvent);
    }
  }

  private handlePointerDown(event: PointerEvent) {
    if (event.button !== PRIMARY_MOUSE_BUTTON || this.resizing) {
      return;
    }

    const allowResize = this.dispatchEvent(
      new ResizeEvent("resizestart", {
        x: 0,
        y: 0,
        clientX: event.clientX,
        clientY: event.clientY,
        cancelable: true,
        bubbles: true,
      }),
    );
    if (!allowResize) {
      return;
    }

    event.preventDefault();
    this.resizing = true;
    this.initialPageX = event.pageX;
    this.initialPageY = event.pageY;
    this.deltaX = 0;
    this.deltaY = 0;
    addEventListener("pointermove", this, { passive: true });
    addEventListener("pointerup", this);
  }

  private handlePointerMove(event: PointerEvent) {
    if (!this.resizing) {
      return;
    }
    this.deltaX = this.direction === "horizontal" ? event.pageX - this.initialPageX : 0;
    this.deltaY = this.direction === "vertical" ? event.pageY - this.initialPageY : 0;

    const allowed = this.dispatchEvent(
      new ResizeEvent("resizedrag", {
        x: this.deltaX,
        y: this.deltaY,
        clientX: event.clientX,
        clientY: event.clientY,
        cancelable: true,
        bubbles: true,
      }),
    );

    if (allowed) {
      requestAnimationFrame(() => {
        this.style.translate = `${this.deltaX}px ${this.deltaY}px`;
      });
    }
  }

  private handlePointerUp(event: PointerEvent) {
    if (!this.resizing) {
      return;
    }
    event.preventDefault();

    this.resizing = false;
    removeEventListener("pointermove", this);
    removeEventListener("pointerup", this);

    this.dispatchEvent(
      new ResizeEvent("resizeend", {
        x: this.deltaX,
        y: this.deltaY,
        clientX: event.clientX,
        clientY: event.clientY,
        bubbles: true,
      }),
    );

    requestAnimationFrame(() => {
      this.style.translate = "";
    });
  }
}

customElements.define("resize-handle", ResizeHandle);
