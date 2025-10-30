// TODO: Implement keyboard interactions:
// https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Roles/menubar_role#keyboard_interactions

const IGNORE_FOCUS_ELEMENTS = new Set(["BUTTON", "SWATCH-SELECT"]);

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
    const { target } = event;

    // Prevent toolbar controls from stealing focus
    if (
      target instanceof Element &&
      IGNORE_FOCUS_ELEMENTS.has(target.tagName)
    ) {
      event.preventDefault();
    }

    event.stopPropagation();
  }
}

customElements.define("floating-toolbar", FloatingToolbar);
