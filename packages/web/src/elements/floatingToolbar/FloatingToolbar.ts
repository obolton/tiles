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

  connectedCallback() {
    this.popover = "manual";
    this.showPopover();
  }

  disconnectedCallback() {
    this.hidePopover();
  }

  handleEvent(event: Event) {
    switch (event.type) {
      case "pointerdown":
        return this.handlePointerDown(event as PointerEvent);
    }
  }

  handlePointerDown(event: PointerEvent) {
    event.preventDefault();
    event.stopPropagation();
  }
}

customElements.define("floating-toolbar", FloatingToolbar);
