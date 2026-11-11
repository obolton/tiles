import "@/elements/resize/ResizeHandle";
import css from "./ResizablePanel.css?inline";
import { adoptStyles } from "@/elements/styles";
import { PanelResizeEvent } from "./events";
import {
  clampSize,
  isPanelEdge,
  panelAxis,
  panelSign,
  resolvePhysicalEdge,
  resolveSize,
  type PanelEdge,
  type PhysicalEdge,
} from "./geometry";
import type { ResizeEvent } from "@/elements/resize/events";
import type { GlobalHTMLAttributes } from "jsx/html-attributes";

const stylesheet = new CSSStyleSheet();
stylesheet.replaceSync(css);

const KEYBOARD_STEP = 16;
const KEYBOARD_STEP_LARGE = 64;

export interface ResizablePanelAttributes extends GlobalHTMLAttributes {
  edge?: PanelEdge;
  size?: number;
  min?: number;
  max?: number;
  disabled?: boolean;
}

declare global {
  interface HTMLElementTagNameMap {
    "resizable-panel": ResizablePanel;
  }
}

declare module "jsx/html-attributes" {
  interface HTMLAttributesByTagName {
    "resizable-panel": ResizablePanelAttributes;
  }
}

export default class ResizablePanel extends HTMLElement {
  static readonly observedAttributes: (keyof ResizablePanelAttributes)[] = [
    "edge",
    "size",
    "min",
    "max",
  ] as const;

  private readonly internals = this.attachInternals();
  private readonly handle = document.createElement("resize-handle");
  private readonly observer = new ResizeObserver(() => this.updateMeasuredValue());
  private startSize = 0;
  private startEdge: PhysicalEdge = "left";

  constructor() {
    super();

    const shadow = this.attachShadow({ mode: "closed" });
    adoptStyles(shadow, stylesheet);

    this.handle.part.add("handle");
    this.handle.role = "separator";
    this.handle.tabIndex = 0;
    this.handle.target = this;

    shadow.append(document.createElement("slot"), this.handle);
  }

  get edge(): PanelEdge {
    const value = this.getAttribute("edge");
    return isPanelEdge(value) ? value : "left";
  }

  set edge(value: PanelEdge) {
    this.setAttribute("edge", value);
  }

  get size(): number {
    return Number(this.getAttribute("size")) || 0;
  }

  set size(value: number) {
    this.setAttribute("size", String(value));
  }

  get min(): number {
    return Number(this.getAttribute("min")) || 0;
  }

  set min(value: number) {
    this.setAttribute("min", String(value));
  }

  get max(): number {
    const value = this.getAttribute("max");
    return value === null ? Infinity : Number(value);
  }

  set max(value: number) {
    if (Number.isFinite(value)) {
      this.setAttribute("max", String(value));
    } else {
      this.removeAttribute("max");
    }
  }

  get disabled(): boolean {
    return this.hasAttribute("disabled");
  }

  set disabled(value: boolean) {
    this.toggleAttribute("disabled", value);
  }

  // Placement/cursor are handled in CSS via logical properties; the resolved
  // physical edge is only needed to map physical pointer/keyboard deltas.
  private get physicalEdge(): PhysicalEdge {
    const direction = getComputedStyle(this).direction === "rtl" ? "rtl" : "ltr";
    return resolvePhysicalEdge(this.edge, direction);
  }

  connectedCallback() {
    this.handle.addEventListener("resizestart", this);
    this.handle.addEventListener("resizedrag", this);
    this.handle.addEventListener("resizeend", this);
    this.handle.addEventListener("keydown", this);

    this.handle.ariaLabel = `Resize ${this.ariaLabel ?? "panel"}`;

    this.updateHandleDirection();
    this.handle.ariaValueMin = String(Math.round(this.min));
    this.handle.ariaValueMax = Number.isFinite(this.max) ? String(Math.round(this.max)) : null;
    this.observer.observe(this);
    this.updateMeasuredValue();
  }

  disconnectedCallback() {
    this.handle.removeEventListener("resizestart", this);
    this.handle.removeEventListener("resizedrag", this);
    this.handle.removeEventListener("resizeend", this);
    this.handle.removeEventListener("keydown", this);
    this.observer.disconnect();
  }

  attributeChangedCallback(name: keyof ResizablePanelAttributes) {
    switch (name) {
      case "edge":
        this.updateHandleDirection();
        break;
      case "size":
        this.setHandleValue(this.size);
        break;
      case "min":
        this.handle.ariaValueMin = String(Math.round(this.min));
        break;
      case "max":
        this.handle.ariaValueMax = Number.isFinite(this.max) ? String(Math.round(this.max)) : null;
        break;
    }
  }

  handleEvent(event: Event) {
    switch (event.type) {
      case "resizestart":
        return this.handleResizeStart();
      case "resizedrag":
        return this.handleResizeDrag(event as ResizeEvent);
      case "resizeend":
        return this.handleResizeEnd(event as ResizeEvent);
      case "keydown":
        return this.handleKeyDown(event as KeyboardEvent);
    }
  }

  private handleResizeStart() {
    if (this.disabled) {
      return;
    }
    this.startEdge = this.physicalEdge;
    const rect = this.getBoundingClientRect();
    this.startSize = panelAxis(this.startEdge) === "y" ? rect.height : rect.width;
    this.internals.states.add("resizing");
    this.dispatchEvent(
      new PanelResizeEvent("panelresizestart", {
        size: this.startSize,
        bubbles: true,
      }),
    );
  }

  private handleResizeDrag(event: ResizeEvent) {
    event.preventDefault();
    this.commit("panelresize", this.sizeFromDrag(event));
  }

  private handleResizeEnd(event: ResizeEvent) {
    this.internals.states.delete("resizing");
    this.commit("panelresizeend", this.sizeFromDrag(event));
  }

  private handleKeyDown(event: KeyboardEvent) {
    if (this.disabled) {
      return;
    }

    const edge = this.physicalEdge;
    const horizontal = panelAxis(edge) === "x";
    const rect = this.getBoundingClientRect();
    const base = horizontal ? rect.width : rect.height;
    const step = event.shiftKey ? KEYBOARD_STEP_LARGE : KEYBOARD_STEP;
    const forwardKey = horizontal ? "ArrowRight" : "ArrowDown";
    const backwardKey = horizontal ? "ArrowLeft" : "ArrowUp";

    let target: number | null = null;
    if (event.key === forwardKey) {
      target = base + step * panelSign(edge);
    } else if (event.key === backwardKey) {
      target = base - step * panelSign(edge);
    } else if (event.key === "Home") {
      target = this.min;
    } else if (event.key === "End" && Number.isFinite(this.max)) {
      target = this.max;
    }

    if (target === null) {
      return;
    }

    event.preventDefault();
    const size = clampSize(target, this.min, this.max);
    this.commit("panelresize", size);
    this.commit("panelresizeend", size);
  }

  private sizeFromDrag(event: ResizeEvent) {
    return resolveSize(this.startEdge, this.startSize, event.x, event.y, this.min, this.max);
  }

  private commit(type: "panelresize" | "panelresizeend", size: number) {
    this.setHandleValue(size);
    this.dispatchEvent(new PanelResizeEvent(type, { size, bubbles: true }));
  }

  private setHandleValue(size: number) {
    const value = Math.round(size);
    this.handle.ariaValueNow = String(value);
    this.handle.ariaValueText = `${value} pixels`;
  }

  private updateMeasuredValue() {
    const rect = this.getBoundingClientRect();
    const size = panelAxis(this.physicalEdge) === "y" ? rect.height : rect.width;
    if (size > 0) {
      this.setHandleValue(size);
    }
  }

  private updateHandleDirection() {
    const horizontal = panelAxis(this.physicalEdge) === "x";
    this.handle.direction = horizontal ? "horizontal" : "vertical";
    this.handle.ariaOrientation = horizontal ? "vertical" : "horizontal";
  }
}

customElements.define("resizable-panel", ResizablePanel);
