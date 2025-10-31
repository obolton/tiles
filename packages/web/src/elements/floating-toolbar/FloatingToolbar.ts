// TODO: Implement keyboard interactions:
// https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Roles/menubar_role#keyboard_interactions

const IGNORE_FOCUS_SELECTOR =
  'button, input[type="button"], input[type="checkbox"], input[type="radio"], input[type="file"], swatch-select, tab-item';

declare global {
  interface HTMLElementTagNameMap {
    "floating-toolbar": FloatingToolbar;
  }
}

export default class FloatingToolbar extends HTMLElement {
  constructor() {
    super();

    const internals = this.attachInternals();
    internals.role = "menubar";

    // Prevent toolbar items from stealing focus on pointer down
    this.addEventListener("pointerdown", this);
  }

  handleEvent(event: Event) {
    switch (event.type) {
      case "pointerdown":
        return this.handlePointerDown(event as PointerEvent);
    }
  }

  private handlePointerDown(event: PointerEvent) {
    // Prevent toolbar controls from stealing focus
    if (
      event.target instanceof Element &&
      event.target.matches(IGNORE_FOCUS_SELECTOR)
    ) {
      event.preventDefault();
    }

    event.stopPropagation();
  }
}

customElements.define("floating-toolbar", FloatingToolbar);
