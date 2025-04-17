import { getPersistent } from "@/utils/state";

export interface DataBindingAttributes {
  href?: string;
  src?: string;
  alt?: string;
}

export default class DataBinding extends HTMLElement {
  constructor() {
    super();
    this.stateChanged = this.stateChanged.bind(this);
  }

  private getBoundAttributeNames() {
    return this.getAttributeNames().filter(
      (attribute) => !attribute.startsWith("data-astro-"),
    );
  }

  private update(attribute: string, value: string | null) {
    const element = this.firstElementChild || this;
    if (attribute === "text") {
      element.textContent = value;
    } else {
      if (value === null) {
        element.removeAttribute(attribute);
      } else {
        element.setAttribute(attribute, value);
      }
    }
  }

  private updateAttributes(matchKey?: string | null) {
    for (const attribute of this.getBoundAttributeNames()) {
      const statePath = this.getAttribute(attribute);
      if (!statePath) {
        throw new Error(
          `Data binding attribute does not have a value: ${attribute}`,
        );
      }
      const [stateKey] = statePath.split(".");
      if (stateKey && (!matchKey || stateKey === matchKey)) {
        this.update(attribute, getPersistent(statePath));
      }
    }
  }

  stateChanged(event: StorageEvent) {
    this.updateAttributes(event.key);
  }

  connectedCallback() {
    window.addEventListener("state:update-persistent", this.stateChanged);
    this.updateAttributes();
  }

  disconnectedCallback() {
    window.removeEventListener("state:update-persistent", this.stateChanged);
  }
}

customElements.define("data-binding", DataBinding);
