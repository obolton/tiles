export interface SwatchItemAttributes {
  value: string;
}

export default class SwatchItem extends HTMLElement {
  constructor() {
    super();
  }

  connectedCallback() {
    this.role = "option";
  }
}
