const VIEWPORT_MARGIN = 64;

export interface PopoverMenuAttributes {
  anchor?: string;
}

export default class PopoverMenu extends HTMLElement {
  static readonly observedAttributes: (keyof PopoverMenuAttributes)[] = [
    "anchor",
  ] as const;

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
  }

  connectedCallback() {
    this.popover = "auto";
  }

  attributeChangedCallback(name: keyof PopoverMenuAttributes) {
    switch (name) {
      case "anchor":
        if (this.hasAttribute("open")) {
          this.setPosition();
        }
        return;
    }
  }

  handleEvent(event: Event) {
    switch (event.type) {
      case "beforetoggle":
        return this.handleBeforeToggle(event as ToggleEvent);
      case "toggle":
        return this.handleToggle(event as ToggleEvent);
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

  private setPosition() {
    const anchor = this.anchorElement;
    if (!anchor) {
      return;
    }

    const width = this.offsetWidth;
    const height = this.offsetHeight;
    const anchorBounds = anchor.getBoundingClientRect();

    const alignLeft =
      anchorBounds.right + width + VIEWPORT_MARGIN < window.innerWidth;
    const alignBottom =
      anchorBounds.bottom + height + VIEWPORT_MARGIN < window.innerHeight;

    const left = alignLeft ? `${anchorBounds.left}px` : "auto";
    const right = alignLeft
      ? "auto"
      : `${window.innerWidth - (anchorBounds.left + anchorBounds.width)}px`;
    const top = alignBottom ? `${anchorBounds.bottom}px` : "auto";
    const bottom = alignBottom
      ? "auto"
      : `${window.innerHeight - anchorBounds.top}px`;

    this.style.transformOrigin = `${alignBottom ? "top" : "bottom"} ${alignLeft ? "left" : "right"}`;
    this.style.inset = `${top} ${right} ${bottom} ${left}`;
  }
}

customElements.define("popover-menu", PopoverMenu);
