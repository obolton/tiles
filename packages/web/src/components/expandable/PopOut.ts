import css from "./PopOut.css?inline";
import { viewTransition } from "@/utils/transitions";

const PRIMARY_MOUSE_BUTTON = 0;

const stylesheet = new CSSStyleSheet();
stylesheet.replaceSync(css);

export default class PopOut extends HTMLElement {
  static readonly observedAttributes = ["expandable"] as const;

  private readonly dialog: HTMLDialogElement;
  private transition?: ViewTransition;

  constructor() {
    super();

    const shadow = this.attachShadow({ mode: "closed", delegatesFocus: true });
    shadow.adoptedStyleSheets.push(stylesheet);

    const closeButton = document.createElement("button");
    closeButton.setAttribute("part", "close");
    closeButton.setAttribute("type", "button");
    closeButton.setAttribute("aria-label", "Close");
    closeButton.setAttribute("id", "close");
    closeButton.addEventListener("click", (event) => {
      event.stopPropagation();
      this.close();
    });

    this.dialog = document.createElement("dialog");
    this.dialog.setAttribute("part", "dialog");
    this.dialog.setAttribute("role", "none");
    this.dialog.append(closeButton, document.createElement("slot"));

    shadow.append(this.dialog);
  }

  attributeChangedCallback(
    name: (typeof PopOut.observedAttributes)[number],
    _: string,
    value: string,
  ) {
    switch (name) {
      case "expandable":
        if (value === "expandable") {
          this.attachEventListeners();
        } else {
          this.removeEventListeners();
        }
    }
  }

  private attachEventListeners() {
    this.dialog.addEventListener("pointerdown", this);
    this.dialog.addEventListener("focusin", this);
    this.dialog.addEventListener("keydown", this);
  }

  private removeEventListeners() {
    this.dialog.removeEventListener("pointerdown", this);
    this.dialog.removeEventListener("focusin", this);
    this.dialog.removeEventListener("keydown", this);
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

  private isExpandable() {
    return this.getAttribute("expandable") === "expandable";
  }

  private isOpen() {
    return this.hasAttribute("open");
  }

  private handlePointerDown(event: PointerEvent) {
    if (event.button !== PRIMARY_MOUSE_BUTTON) {
      return;
    }

    if (this.isOpen() && event.target === this.dialog) {
      this.close();

      // Prevent pointer events on overlay from bubbling up
      event.stopPropagation();
    } else if (!this.isOpen()) {
      this.open();
    }
  }

  private handleFocusIn(event: FocusEvent) {
    if (this.isOpen() || this.transition) {
      return;
    }

    this.open(event.target instanceof HTMLElement ? event.target : undefined);
  }

  private handleKeyDown(event: KeyboardEvent) {
    if (event.key === "Escape" && this.isOpen()) {
      event.preventDefault();
      this.close();
    } else if (event.key === "Enter" && !this.isOpen()) {
      event.preventDefault();
      this.open();
    }
  }

  open(focusTarget?: HTMLElement) {
    if (this.isOpen() || this.transition) {
      return;
    }

    this.dispatchEvent(
      new ToggleEvent("beforetoggle", { oldState: "closed", newState: "open" }),
    );

    this.setAttribute("opening", "");

    this.transition = viewTransition(() => {
      this.setAttribute("open", "");
      this.dialog.setAttribute("role", "dialog");
      this.dialog.showModal();

      this.dispatchEvent(
        new ToggleEvent("toggle", { oldState: "closed", newState: "open" }),
      );
    });
    this.transition.finished.then(() => {
      delete this.transition;
      this.removeAttribute("opening");
      focusTarget?.focus();
    });
  }

  close() {
    if (!this.isOpen() || this.transition) {
      return;
    }

    this.dispatchEvent(
      new ToggleEvent("beforetoggle", { oldState: "open", newState: "closed" }),
    );

    this.setAttribute("closing", "");

    this.transition = viewTransition(() => {
      this.dialog.close();
      this.dialog.setAttribute("role", "none");
      this.removeAttribute("open");

      this.dispatchEvent(
        new ToggleEvent("toggle", { oldState: "open", newState: "closed" }),
      );
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
