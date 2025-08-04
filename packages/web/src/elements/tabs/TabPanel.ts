import { focusInside } from "@/utils/focus";

export interface TabPanelAttributes {
  open?: boolean;
}

export default class TabPanel extends HTMLElement {
  constructor() {
    super();
  }

  show() {
    this.setAttribute("open", "");
    focusInside(this);
  }

  hide() {
    this.removeAttribute("open");
  }
}

customElements.define("tab-panel", TabPanel);
