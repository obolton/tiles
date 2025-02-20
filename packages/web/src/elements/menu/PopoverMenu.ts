export interface PopoverMenuAttributes {
  anchor: string;
}

export default class PopoverMenu extends HTMLElement {
  static readonly observedAttributes: (keyof PopoverMenuAttributes)[] = [
    "anchor",
  ] as const;

  constructor() {
    super();
    this.addEventListener("toggle", this, { passive: true });
  }

  get anchorElement() {
    const id = this.getAttribute("anchor");
    if (!id) {
      throw new Error("Missing anchor attribute");
    }
    const element = document.getElementById(id);
    if (!element) {
      throw new Error(`Anchor element with ID "${id}" not found`);
    }
    return element;
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
      case "toggle":
        return this.handleToggle(event as ToggleEvent);
    }
  }

  private handleToggle(event: ToggleEvent) {
    const trigger = document.querySelector(`[popovertarget="${this.id}"]`);

    if (event.newState === "open") {
      this.setPosition();
      trigger?.setAttribute("aria-expanded", "true");
    } else {
      trigger?.setAttribute("aria-expanded", "false");
    }
  }

  private setPosition() {
    const width = this.offsetWidth;
    const height = this.offsetHeight;
    const anchorBounds = this.anchorElement.getBoundingClientRect();

    const alignLeft = anchorBounds.right + width < window.innerWidth;
    const alignBottom = anchorBounds.bottom + height < window.innerHeight;

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
