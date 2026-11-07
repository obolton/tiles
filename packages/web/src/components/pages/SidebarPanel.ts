import { flag } from "reactivity";
import { focusInside, getFocusedDescendant } from "@/utils/focus";

/** The header's overflow menu button, which opens the panels when their own buttons are collapsed into it. */
export const PAGE_ACTIONS_BUTTON_ID = "page-actions-button";

/** Open state for a panel in the editor's end slot, moving focus into the panel on open and back to its button on close. */
export default class SidebarPanel {
  readonly isOpen = flag(false);

  constructor(
    readonly panelId: string,
    readonly buttonId: string | null = null,
  ) {}

  open() {
    if (this.isOpen.value) {
      return;
    }
    this.isOpen.on();
    requestAnimationFrame(() => {
      const panel = document.getElementById(this.panelId);
      if (panel) {
        focusInside(panel);
      }
    });
  }

  close() {
    if (!this.isOpen.value) {
      return;
    }
    // Capture focus before the flag flips and the panel detaches
    const panel = document.getElementById(this.panelId);
    const hadFocus = !!panel && !!getFocusedDescendant(panel);
    this.isOpen.off();
    if (hadFocus && this.buttonId) {
      const button =
        document.getElementById(this.buttonId) ?? document.getElementById(PAGE_ACTIONS_BUTTON_ID);
      button?.focus();
    }
  }

  toggle() {
    if (this.isOpen.value) {
      this.close();
    } else {
      this.open();
    }
  }
}
