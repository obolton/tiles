import { reactive } from "carillon";
import { focusInside, getFocusedDescendant } from "@/utils/focus";
import type { Reactive, ReactiveValue } from "carillon";

/** The header's overflow menu button, which opens the share and version history panels. */
export const PAGE_ACTIONS_BUTTON_ID = "page-actions-button";

/** Holds the panel that is open in a sidebar, so that opening one panel closes another. */
export type SidebarSlot = ReactiveValue<SidebarPanel | null>;

/** Open state for a panel in the editor's end sidebar, moving focus into the panel on open and back to its button on close. */
export default class SidebarPanel {
  readonly isOpen: Reactive<boolean>;

  constructor(
    readonly panelId: string,
    readonly buttonId: string | null = null,
    protected readonly sidebar: SidebarSlot = reactive<SidebarPanel | null>(null),
  ) {
    this.isOpen = sidebar.derive((panel) => panel === this);
  }

  open() {
    if (this.isOpen.value) {
      return;
    }
    this.sidebar.value?.close();
    this.sidebar.value = this;
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
    // Capture focus before the panel detaches
    const panel = document.getElementById(this.panelId);
    const hadFocus = !!panel && !!getFocusedDescendant(panel);
    this.sidebar.value = null;
    if (hadFocus && this.buttonId) {
      document.getElementById(this.buttonId)?.focus();
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
