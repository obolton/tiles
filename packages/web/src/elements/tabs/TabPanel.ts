import { focusInside } from "@/utils/focus";
import type { GlobalHTMLAttributes } from "brushstroke";

declare global {
  interface HTMLElementTagNameMap {
    "tab-panel": TabPanel;
  }
}

export interface TabPanelAttributes extends GlobalHTMLAttributes {
  open?: boolean;
}

declare module "brushstroke" {
  interface HTMLAttributesByTagName {
    "tab-panel": TabPanelAttributes;
  }
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
