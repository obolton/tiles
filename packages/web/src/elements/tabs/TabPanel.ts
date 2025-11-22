import { focusInside } from "@/utils/focus";

declare global {
  interface HTMLElementTagNameMap {
    "tab-panel": TabPanel;
  }
}

export interface TabPanelAttributes {
  open?: boolean;
}

export default class TabPanel extends HTMLElement {
  show() {
    if (!this.hasAttribute("open")) {
      this.setAttribute("open", "");
      focusInside(this);
    }
  }

  hide() {
    this.removeAttribute("open");
  }
}

customElements.define("tab-panel", TabPanel);
