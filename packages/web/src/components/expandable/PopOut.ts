import css from "./PopOut.css?inline";
import { appearFrom, disappearTo } from "@/utils/animation/effects";

const PRIMARY_MOUSE_BUTTON = 0;

const stylesheet = new CSSStyleSheet();
stylesheet.replaceSync(css);

export default class PopOut extends HTMLElement {
  static observedAttributes = ["expandable", "origin"] as const;

  private readonly internals: ElementInternals;
  private readonly dialog: HTMLDialogElement;
  private readonly contents: HTMLElement;
  private expanded = false;
  private animating = false;

  constructor() {
    super();

    const shadow = this.attachShadow({ mode: "closed", delegatesFocus: true });
    shadow.adoptedStyleSheets = [stylesheet];

    this.internals = this.attachInternals();

    const closeButton = document.createElement("button");
    closeButton.setAttribute("type", "button");
    closeButton.setAttribute("aria-label", "Close");
    closeButton.setAttribute("id", "close");
    closeButton.addEventListener("click", (event) => {
      event.stopPropagation();
      this.hide();
    });

    this.contents = document.createElement("section");
    this.contents.append(document.createElement("slot"));

    this.dialog = document.createElement("dialog");
    this.dialog.setAttribute("role", "none");
    this.dialog.addEventListener("pointerdown", this);
    this.dialog.append(closeButton, this.contents);

    shadow.append(this.dialog);

    this.addEventListener("focusin", this);
    this.addEventListener("keydown", this);
  }

  private isExpandable() {
    return this.getAttribute("expandable") === "expandable";
  }

  private getTransformOrigin() {
    switch (this.getAttribute("origin")) {
      case "center":
        return { x: 0.5, y: 0.5 };
      case "top-left":
      default:
        return { x: 0, y: 0 };
    }
  }

  handleEvent(event: Event) {
    switch (event.type) {
      case "pointerdown":
        return this.handlePointerDown(event as PointerEvent);
      case "focusin":
        return this.handleFocusIn(event as FocusEvent);
      case "keydown":
        return this.handleKeyDown(event as KeyboardEvent);
    }
  }

  private handlePointerDown(event: PointerEvent) {
    if (!this.isExpandable() || event.button !== PRIMARY_MOUSE_BUTTON) {
      return;
    }

    if (this.expanded && event.target === this.dialog) {
      this.hide();

      // Prevent pointer events on overlay from bubbling up
      event.stopPropagation();
    } else if (!this.expanded) {
      this.show();
    }
  }

  private handleFocusIn(event: FocusEvent) {
    if (!this.isExpandable() || this.expanded || this.animating) {
      return;
    }

    this.show();

    if (event.target instanceof HTMLElement) {
      event.target.focus();
    }
  }

  private handleKeyDown(event: KeyboardEvent) {
    if (event.key === "Escape" && this.expanded) {
      event.preventDefault();
      this.hide();
    } else if (event.key === "Enter" && !this.expanded && this.isExpandable()) {
      event.preventDefault();
      this.show();
    }
  }

  show() {
    if (this.expanded || this.animating) {
      return;
    }

    this.expanded = true;
    this.animating = true;
    this.internals.states.add("expanded");
    this.internals.states.add("overlay");
    this.dialog.setAttribute("role", "dialog");
    this.dialog.showModal();

    appearFrom(this.contents, {
      origin: this,
      scaling: false,
      transformOrigin: this.getTransformOrigin(),
    }).finally(() => {
      this.animating = false;
    });
  }

  hide() {
    if (!this.expanded || this.animating) {
      return;
    }

    this.animating = true;
    this.internals.states.delete("expanded");
    this.dialog.setAttribute("role", "none");

    disappearTo(this.contents, {
      destination: this,
      scaling: false,
      transformOrigin: this.getTransformOrigin(),
    }).finally(() => {
      this.dialog.close();

      const activeElement = document.activeElement;
      if (
        activeElement instanceof HTMLElement &&
        this.contains(activeElement)
      ) {
        activeElement.blur();
      }

      this.internals.states.delete("overlay");
      this.animating = false;
      this.expanded = false;
    });
  }
}
