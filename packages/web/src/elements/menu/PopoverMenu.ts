import AnchoredPopover from "@/elements/anchored-popover/AnchoredPopover";
import KeyboardNavigation from "@/utils/keyboard";
import type { AnchoredPopoverAttributes } from "@/elements/anchored-popover/AnchoredPopover";

export type PopoverMenuAttributes = AnchoredPopoverAttributes;

declare global {
  interface HTMLElementTagNameMap {
    "popover-menu": PopoverMenu;
  }
}

declare module "@/jsx/html-attributes" {
  interface HTMLAttributesByTagName {
    "popover-menu": PopoverMenuAttributes;
  }
}

export default class PopoverMenu extends AnchoredPopover {
  private navigation = new KeyboardNavigation(this, {
    selector: ".menuitem",
    orientation: "vertical",
  });

  connectedCallback() {
    super.connectedCallback();
    this.navigation.attach();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.navigation.detach();
  }

  protected handleToggle(event: ToggleEvent) {
    super.handleToggle(event);

    if (event.newState === "open") {
      this.navigation.focusFirst();
    }
  }
}

customElements.define("popover-menu", PopoverMenu);
