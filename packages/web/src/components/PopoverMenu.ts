export default class PopoverMenu extends HTMLElement {
  static observedAttributes = ["anchor", "align"] as const;

  private state: "open" | "closed" = "closed";

  constructor() {
    super();

    this.addEventListener("beforetoggle", this, { passive: true });
  }

  connectedCallback() {
    this.setAttribute("popover", "");
  }

  handleEvent(event: Event) {
    switch (event.type) {
      case "beforetoggle":
        this.beforeToggle(event as ToggleEvent);
        break;
    }
  }

  private setPosition() {
    const anchorElementId = this.getAttribute("anchor");
    if (!anchorElementId) {
      throw new Error("Missing anchor attribute");
    }
    const anchor = document.getElementById(anchorElementId);
    if (!anchor) {
      throw new Error(`Anchor element with ID "${anchorElementId}" not found`);
    }

    const rect = anchor.getBoundingClientRect();
    const alignLeft = rect.right < window.innerWidth - 150;
    const alignBottom = rect.bottom < window.innerHeight - 150;

    const left = alignLeft ? `${rect.left}px` : "auto";
    const right = alignLeft
      ? "auto"
      : `${window.innerWidth - (rect.left + rect.width)}px`;
    const top = alignBottom ? `${rect.bottom}px` : "auto";
    const bottom = alignBottom ? "auto" : `${window.innerHeight - rect.top}px`;

    this.style.setProperty(
      "transform-origin",
      `${alignBottom ? "top" : "bottom"} ${alignLeft ? "left" : "right"}`,
    );
    this.style.setProperty("inset", `${top} ${right} ${bottom} ${left}`);
  }

  beforeToggle(event: ToggleEvent) {
    this.state = event.newState as "open" | "closed";
    const trigger = document.querySelector(`[popovertarget="${this.id}"]`);

    if (event.newState === "open") {
      this.setPosition();
      trigger?.setAttribute("aria-expanded", "true");
    } else {
      trigger?.setAttribute("aria-expanded", "false");
    }
  }

  attributeChangedCallback(
    name: (typeof PopoverMenu.observedAttributes)[number],
  ) {
    switch (name) {
      case "anchor":
        if (this.state === "open") {
          this.setPosition();
        }
        return;

      case "align":
        if (this.state === "open") {
          this.setPosition();
        }
        return;
    }
  }
}
