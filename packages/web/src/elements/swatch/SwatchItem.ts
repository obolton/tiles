export interface SwatchItemAttributes {
  value: string;
}

export default class SwatchItem extends HTMLElement {
  connectedCallback() {
    this.role = "option";
  }
}

customElements.define("swatch-item", SwatchItem);
