import { flag } from "reactivity";
import { focusInside, getFocusedDescendant } from "@/utils/focus";

/**
 * Open state for a panel in the editor's end slot, moving focus into the panel on open and back
 * to the element that opened it on close.
 */
export default class SidebarPanel {
  readonly isOpen = flag(false);
  private returnFocusId: string | null;

  constructor(
    readonly panelId: string,
    readonly buttonId: string | null = null,
  ) {
    this.returnFocusId = buttonId;
  }

  /** Opens the panel. Focus returns to the given element, or the panel's button, on close. */
  open(returnFocusId: string | null = this.buttonId) {
    if (this.isOpen.value) {
      return;
    }
    this.returnFocusId = returnFocusId;
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
    if (hadFocus && this.returnFocusId) {
      document.getElementById(this.returnFocusId)?.focus();
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
