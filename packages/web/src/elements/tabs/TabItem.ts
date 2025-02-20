import TabPanel from "./TabPanel";

export interface TabItemAttributes {
  selected?: boolean;
  for?: string;
}

export default class TabItem extends HTMLElement {
  static readonly observedAttributes: (keyof TabItemAttributes)[] = [
    "for",
  ] as const;

  private internals: ElementInternals;

  constructor() {
    super();

    this.internals = this.attachInternals();
    this.internals.role = "tab";
  }

  connectedCallback() {
    if (!this.hasAttribute("tabindex")) {
      this.tabIndex = 0;
    }
  }

  attributeChangedCallback(
    name: keyof TabItemAttributes,
    _: string,
    value: string | null,
  ) {
    switch (name) {
      case "for":
        if (value === null) {
          this.removeAttribute("aria-controls");
        } else {
          this.setAttribute("aria-controls", value);
        }
    }
  }

  get selected() {
    return this.hasAttribute("selected");
  }

  set selected(value: boolean) {
    if (value) {
      this.setAttribute("selected", "");
      this.internals.ariaSelected = "true";
      this.panel?.show();
    } else {
      this.removeAttribute("selected");
      this.internals.ariaSelected = "false";
      this.panel?.hide();
    }
  }

  get panel() {
    const forId = this.getAttribute("for");
    if (!forId) {
      return null;
    }

    const panel = document.getElementById(forId);
    if (!panel || !(panel instanceof TabPanel)) {
      return null;
    }

    return panel;
  }
}

customElements.define("tab-item", TabItem);
