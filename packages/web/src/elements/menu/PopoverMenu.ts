import AnchoredPopover from "@/elements/anchored-popover/AnchoredPopover";
import KeyboardNavigation from "@/utils/keyboard";
import type { AnchoredPopoverAttributes } from "@/elements/anchored-popover/AnchoredPopover";

export type PopoverMenuAttributes = AnchoredPopoverAttributes;

declare global {
  interface HTMLElementTagNameMap {
    "popover-menu": PopoverMenu;
  }
}

declare module "jsx/html-attributes" {
  interface HTMLAttributesByTagName {
    "popover-menu": PopoverMenuAttributes;
  }
}

const ITEM_SELECTOR = '[role^="menuitem"]';
const ACTION_ITEM_SELECTOR = '[role="menuitem"]';

export default class PopoverMenu extends AnchoredPopover {
  private navigation = new KeyboardNavigation(this, {
    selector: ITEM_SELECTOR,
    orientation: "vertical",
  });

  constructor() {
    super();

    const internals = this.attachInternals();
    internals.role = "menu";

    this.addEventListener("pointermove", this, { passive: true });
    this.addEventListener("keydown", this, { passive: true });
    this.addEventListener("click", this, { passive: true });
  }

  connectedCallback() {
    super.connectedCallback();
    this.navigation.attach();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.navigation.detach();
  }

  handleEvent(event: Event) {
    super.handleEvent(event);

    switch (event.type) {
      case "pointermove":
        return this.handlePointerMove(event as PointerEvent);
      case "keydown":
        return this.handleKeyDown(event as KeyboardEvent);
      case "click":
        return this.handleClick(event as MouseEvent);
    }
  }

  // Activating a plain menu item dismisses the menu. Checkbox and radio items
  // toggle state and keep the menu open.
  private handleClick(event: MouseEvent) {
    const target = event.target;
    if (target instanceof Element && target.closest(ACTION_ITEM_SELECTOR)) {
      this.hidePopover();
    }
  }

  private handleKeyDown(event: KeyboardEvent) {
    if (event.defaultPrevented) {
      return;
    }

    if (
      (event.key === "ArrowLeft" || event.key === "ArrowRight") &&
      this.matches(":popover-open")
    ) {
      this.hidePopover();
    }
  }

  private handlePointerMove(event: PointerEvent) {
    const target = event.target;
    if (!(target instanceof HTMLElement)) {
      return;
    }
    const item = target.closest<HTMLElement>(ITEM_SELECTOR);
    if (item && item !== this.navigation.activeItem) {
      this.navigation.setActiveItem(item, true);
    }
  }

  protected handleToggle(event: ToggleEvent) {
    super.handleToggle(event);

    if (event.newState === "open") {
      this.navigation.focusFirst();
    }
  }
}

customElements.define("popover-menu", PopoverMenu);
