// TODO: Implement keyboard interactions:
// https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Roles/menubar_role#keyboard_interactions

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
      (target.tagName === "BUTTON" || target.tagName === "SWATCH-SELECT")
    ) {
      event.preventDefault();
    }

    event.stopPropagation();
  }
}

customElements.define("floating-toolbar", FloatingToolbar);
