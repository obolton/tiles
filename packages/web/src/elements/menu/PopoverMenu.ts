const VIEWPORT_MARGIN = 64;

type Alignment = "left" | "center" | "right" | "auto";

export interface PopoverMenuAttributes {
  anchor?: string;
  align?: Alignment;
}

export default class PopoverMenu extends HTMLElement {
  static readonly observedAttributes: (keyof PopoverMenuAttributes)[] = [
    "anchor",
    "align",
  ] as const;

  align: Alignment = "auto";

  #anchorElement: HTMLElement | null = null;

  get anchorElement() {
    if (this.#anchorElement) {
      return this.#anchorElement;
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
    this.addEventListener("click", this);
  }

  connectedCallback() {
    this.popover = "auto";
  }

  attributeChangedCallback(
    name: keyof PopoverMenuAttributes,
    _: string | null,
    value: string | null,
  ) {
    switch (name) {
      case "anchor":
        if (this.hasAttribute("open")) {
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
      case "click":
        return this.handleClick(event as PointerEvent);
    }
  }

  protected handleBeforeToggle(event: ToggleEvent) {
    // Hide the element until we have moved it into position
    if (event.newState === "open") {
      this.style.setProperty("visibility", "hidden");
    }
  }

  protected handleToggle(event: ToggleEvent) {
    if (event.newState === "open") {
      requestAnimationFrame(() => {
        this.setPosition();
        this.style.removeProperty("visibility");
      });
    }

    const trigger = document.querySelector(`[popovertarget="${this.id}"]`);
    if (trigger) {
      trigger.ariaExpanded = event.newState === "open" ? "true" : "false";
    }
  }

  protected handleClick(event: PointerEvent) {
    if (!event.defaultPrevented) {
      this.hidePopover();
    }
  }

  private getHorizontalAlignment(anchorBounds: DOMRect, width: number) {
    if (this.align === "auto") {
      return anchorBounds.right + width + VIEWPORT_MARGIN < window.innerWidth
        ? "left"
        : "right";
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

    const horizontalAlignment = this.getHorizontalAlignment(
      anchorBounds,
      width,
    );

    const verticalPosition =
      anchorBounds.bottom + height + VIEWPORT_MARGIN < window.innerHeight
        ? "bottom"
        : "top";

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
        right =
          window.innerWidth - (anchorBounds.left + anchorBounds.width) + "px";
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

customElements.define("popover-menu", PopoverMenu);
