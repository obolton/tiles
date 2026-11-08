import type { GlobalHTMLAttributes } from "jsx/html-attributes";

const VIEWPORT_MARGIN = 64;
const SUPPORTS_ANCHOR_POSITIONING = CSS.supports("anchor-name", "--anchor");

let anchorCount = 0;

/**
 * Gives an element a stable anchor name on first use. The name is left in place afterwards so
 * popovers stay anchored while they transition out, and it is unique per element so popovers
 * can share an anchor and be opened from multiple triggers.
 */
function getAnchorName(element: HTMLElement) {
  if (!element.style.anchorName) {
    element.style.anchorName = `--anchor-${++anchorCount}`;
  }
  return element.style.anchorName;
}

export type Alignment = "left" | "center" | "right" | "auto";

export interface AnchoredPopoverAttributes extends GlobalHTMLAttributes {
  anchor?: string;
  align?: Alignment;
}

declare global {
  interface HTMLElementTagNameMap {
    "anchored-popover": AnchoredPopover;
  }
}

declare module "jsx/html-attributes" {
  interface HTMLAttributesByTagName {
    "anchored-popover": AnchoredPopoverAttributes;
  }
}

export default class AnchoredPopover extends HTMLElement {
  static readonly observedAttributes: (keyof AnchoredPopoverAttributes)[] = [
    "anchor",
    "align",
  ] as const;

  align: Alignment = "auto";

  #anchorElement: HTMLElement | null = null;
  #triggerElement: HTMLElement | null = null;
  #positionAbortController: AbortController | null = null;

  get anchorElement() {
    if (this.#anchorElement) {
      return this.#anchorElement;
    }

    if (this.#triggerElement) {
      return this.#triggerElement;
    }

    const id = this.getAttribute("anchor");
    if (!id) {
      return null;
    }
    return document.getElementById(id);
  }

  set anchorElement(element: HTMLElement | null) {
    this.#anchorElement = element;
  }

  constructor() {
    super();
    this.addEventListener("beforetoggle", this, { passive: true });
    this.addEventListener("toggle", this, { passive: true });
  }

  connectedCallback() {
    this.popover = "auto";
  }

  disconnectedCallback() {
    this.#cleanup();
  }

  attributeChangedCallback(
    name: keyof AnchoredPopoverAttributes,
    _: string | null,
    value: string | null,
  ) {
    switch (name) {
      case "anchor":
        if (this.matches(":popover-open")) {
          this.setPosition();
        }
        return;
      case "align":
        if (value === "left" || value === "center" || value === "right") {
          this.align = value;
        } else {
          this.align = "auto";
        }
        break;
    }
  }

  handleEvent(event: Event) {
    switch (event.type) {
      case "beforetoggle":
        return this.handleBeforeToggle(event as ToggleEvent);
      case "toggle":
        return this.handleToggle(event as ToggleEvent);
      case "scroll":
      case "resize":
        return this.setPosition();
    }
  }

  protected handleBeforeToggle(event: ToggleEvent) {
    if (event.defaultPrevented) {
      return;
    }

    if (event.newState === "open") {
      this.#triggerElement = this.#getTriggerElement();
      if (SUPPORTS_ANCHOR_POSITIONING) {
        this.#applyAnchorPositioning();
      } else {
        this.style.setProperty("visibility", "hidden");
      }
    }

    if (this.#triggerElement) {
      this.#triggerElement.ariaExpanded = event.newState === "open" ? "true" : "false";
    }
  }

  #getTriggerElement(): HTMLElement | null {
    const activeElement = document.activeElement;
    if (
      activeElement instanceof HTMLElement &&
      activeElement.getAttribute("popovertarget") === this.id
    ) {
      return activeElement;
    }

    const trigger = document.querySelector(`[popovertarget="${this.id}"]`);
    if (trigger instanceof HTMLElement) {
      return trigger;
    }

    return null;
  }

  protected handleToggle(event: ToggleEvent) {
    if (event.newState === "open") {
      if (!SUPPORTS_ANCHOR_POSITIONING) {
        requestAnimationFrame(() => {
          this.setPosition();
          this.style.removeProperty("visibility");
          this.#addPositionListeners();
        });
      }
    } else {
      this.#cleanup();
    }
  }

  #applyAnchorPositioning() {
    const anchor = this.anchorElement;
    if (!anchor) {
      return;
    }

    this.style.positionAnchor = getAnchorName(anchor);
  }

  #addPositionListeners() {
    this.#positionAbortController = new AbortController();
    const { signal } = this.#positionAbortController;

    window.addEventListener("scroll", this, { passive: true, signal });
    window.addEventListener("resize", this, { passive: true, signal });
  }

  #cleanup() {
    this.#positionAbortController?.abort();
    this.#positionAbortController = null;
    this.#triggerElement = null;
  }

  private getHorizontalAlignment(anchorBounds: DOMRect, width: number) {
    if (this.align === "auto") {
      return anchorBounds.right + width + VIEWPORT_MARGIN < window.innerWidth ? "left" : "right";
    }
    return this.align;
  }

  private setPosition() {
    const anchor = this.anchorElement;
    if (!anchor) {
      return;
    }

    const width = this.offsetWidth;
    const height = this.offsetHeight;
    const anchorBounds = anchor.getBoundingClientRect();

    const horizontalAlignment = this.getHorizontalAlignment(anchorBounds, width);

    const verticalPosition =
      anchorBounds.bottom + height + VIEWPORT_MARGIN < window.innerHeight ? "bottom" : "top";

    let left = "auto";
    let right = "auto";
    let top = "auto";
    let bottom = "auto";
    let verticalOrigin = "top";

    switch (horizontalAlignment) {
      case "left":
        left = anchorBounds.left + "px";
        break;
      case "right":
        right = window.innerWidth - (anchorBounds.left + anchorBounds.width) + "px";
        break;
      case "center":
        left = anchorBounds.left + (anchorBounds.width - width) / 2 + "px";
        break;
    }

    switch (verticalPosition) {
      case "top":
        bottom = window.innerHeight - anchorBounds.top + "px";
        verticalOrigin = "bottom";
        break;
      case "bottom":
        top = anchorBounds.bottom + "px";
        verticalOrigin = "top";
        break;
    }

    this.style.transformOrigin = `${horizontalAlignment} ${verticalOrigin}`;
    this.style.inset = `${top} ${right} ${bottom} ${left}`;
  }
}

customElements.define("anchored-popover", AnchoredPopover);
