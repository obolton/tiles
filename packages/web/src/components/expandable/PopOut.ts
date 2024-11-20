import css from "./PopOut.css?inline";
import { viewTransition } from "@/utils/transitions";

const PRIMARY_MOUSE_BUTTON = 0;

const stylesheet = new CSSStyleSheet();
stylesheet.replaceSync(css);

export default class PopOut extends HTMLElement {
  static observedAttributes = ["expandable", "origin"] as const;

  private readonly dialog: HTMLDialogElement;
  private transition?: ViewTransition;

  constructor() {
    super();

    const shadow = this.attachShadow({ mode: "closed", delegatesFocus: true });
    shadow.adoptedStyleSheets = [stylesheet];

    const closeButton = document.createElement("button");
    closeButton.setAttribute("part", "close");
    closeButton.setAttribute("type", "button");
    closeButton.setAttribute("aria-label", "Close");
    closeButton.setAttribute("id", "close");
    closeButton.addEventListener("click", (event) => {
      event.stopPropagation();
      this.hide();
    });

    this.dialog = document.createElement("dialog");
    this.dialog.setAttribute("part", "dialog");
    this.dialog.setAttribute("role", "none");
    this.dialog.addEventListener("pointerdown", this);
    this.dialog.append(closeButton, document.createElement("slot"));

    shadow.append(this.dialog);

    this.addEventListener("focusin", this);
    this.addEventListener("keydown", this);
  }

  private isOpen() {
    return this.hasAttribute("open");
  }

  private isExpandable() {
    return this.getAttribute("expandable") === "expandable";
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

    if (this.isOpen() && event.target === this.dialog) {
      this.hide();

      // Prevent pointer events on overlay from bubbling up
      event.stopPropagation();
    } else if (!this.isOpen()) {
      this.show();
    }
  }

  private handleFocusIn(event: FocusEvent) {
    if (!this.isExpandable() || this.isOpen() || this.transition) {
      return;
    }

    this.show();

    if (event.target instanceof HTMLElement) {
      event.target.focus();
    }
  }

  private handleKeyDown(event: KeyboardEvent) {
    if (event.key === "Escape" && this.isOpen()) {
      event.preventDefault();
      this.hide();
    } else if (event.key === "Enter" && !this.isOpen() && this.isExpandable()) {
      event.preventDefault();
      this.show();
    }
  }

  show() {
    if (this.isOpen() || this.transition) {
      return;
    }

    this.setAttribute("opening", "");

    this.transition = viewTransition(() => {
      this.setAttribute("open", "");
      this.dialog.setAttribute("role", "dialog");
      this.dialog.showModal();
    });
    this.transition.finished.then(() => {
      delete this.transition;
      this.removeAttribute("opening");
    });
  }

  hide() {
    if (!this.isOpen() || this.transition) {
      return;
    }

    this.setAttribute("closing", "");

    this.transition = viewTransition(() => {
      this.dialog.close();
      this.dialog.setAttribute("role", "none");
      this.removeAttribute("open");
    });
    this.transition.finished.then(() => {
      delete this.transition;
      this.removeAttribute("closing");

      const activeElement = document.activeElement;
      if (
        activeElement instanceof HTMLElement &&
        this.contains(activeElement)
      ) {
        activeElement.blur();
      }
    });
  }
}
