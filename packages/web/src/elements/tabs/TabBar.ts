import TabItem from "./TabItem";

declare global {
  interface HTMLElementTagNameMap {
    "tab-bar": TabBar;
  }
}

export default class TabBar extends HTMLElement {
  private internals: ElementInternals;

  constructor() {
    super();

    this.internals = this.attachInternals();
    this.internals.role = "tablist";
    this.internals.ariaOrientation = "horizontal";

    this.addEventListener("click", this);
    this.addEventListener("keydown", this);
  }

  handleEvent(event: Event) {
    switch (event.type) {
      case "click":
        return this.handleClick(event as MouseEvent);
      case "keydown":
        return this.handleKeyDown(event as KeyboardEvent);
    }
  }

  private handleClick(event: MouseEvent) {
    if (event.target instanceof TabItem) {
      this.select(event.target.id);
    }
  }

  private handleKeyDown(event: KeyboardEvent) {
    if (
      event.target instanceof TabItem &&
      (event.key === "Enter" || event.key === " ")
    ) {
      event.preventDefault();
      this.select(event.target.id);
    }
  }

  select(id: string) {
    this.querySelectorAll<TabItem>(`tab-item`)?.forEach((item) => {
      item.selected = item.id === id;
    });
  }
}

customElements.define("tab-bar", TabBar);
