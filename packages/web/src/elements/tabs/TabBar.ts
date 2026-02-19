import TabItem from "./TabItem";
import KeyboardNavigation from "@/utils/keyboard";

declare global {
  interface HTMLElementTagNameMap {
    "tab-bar": TabBar;
  }
}

export default class TabBar extends HTMLElement {
  private internals: ElementInternals;
  private navigation: KeyboardNavigation;

  constructor() {
    super();

    this.internals = this.attachInternals();
    this.internals.role = "tablist";
    this.internals.ariaOrientation = "horizontal";

    this.navigation = new KeyboardNavigation(this, {
      selector: "tab-item",
      orientation: "horizontal",
    });

    this.addEventListener("click", this);
    this.addEventListener("focusin", this);
  }

  connectedCallback() {
    this.navigation.attach();
    const selected = this.querySelector<TabItem>("tab-item[selected]");
    this.navigation.setActiveItem(selected ?? this.navigation.items[0] ?? null);
  }

  disconnectedCallback() {
    this.navigation.detach();
  }

  handleEvent(event: Event) {
    if (event.target instanceof TabItem) {
      this.select(event.target.id);
    }
  }

  select(id: string) {
    let selected: TabItem | null = null;
    for (const item of this.querySelectorAll<TabItem>("tab-item")) {
      item.selected = item.id === id;
      if (item.id === id) {
        selected = item;
      }
    }
    this.navigation.setActiveItem(selected);
  }
}

customElements.define("tab-bar", TabBar);
