class PopoverMenu extends HTMLElement {
  static observedAttributes = ["anchor", "align"];

  private state: "open" | "closed" = "closed";
  private anchor: HTMLElement | null = null;

  constructor() {
    super();
    this.addEventListener("beforetoggle", this.beforeToggle.bind(this), {
      passive: true,
    });
  }

  connectedCallback() {
    this.setAttribute("popover", "");
  }

  private setPosition() {
    if (!this.anchor) {
      return;
    }

    const rect = this.anchor.getBoundingClientRect();
    const alignment = this.getAttribute("align") ?? "left";

    if (alignment === "left") {
      this.style.setProperty(
        "inset",
        `${rect.bottom}px auto auto ${rect.left}px`,
      );
    } else {
      this.style.setProperty(
        "inset",
        `${rect.bottom}px ${window.innerWidth - (rect.left + rect.width)}px auto auto`,
      );
    }
  }

  beforeToggle(event: ToggleEvent) {
    this.state = event.newState as "open" | "closed";
    const trigger = document.querySelector(`[popovertarget="${this.id}"]`);

    if (event.newState === "open") {
      this.setPosition();
      trigger?.setAttribute("aria-pressed", "true");
    } else {
      trigger?.setAttribute("aria-pressed", "false");
    }
  }

  attributeChangedCallback(name: string, _: string, value: string) {
    switch (name) {
      case "anchor":
        this.anchor = value ? document.getElementById(value) : null;
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

customElements.define("popover-menu", PopoverMenu);
