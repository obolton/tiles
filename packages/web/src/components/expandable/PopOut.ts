import css from "./PopOut.css?inline";
import { viewTransition } from "@/utils/transitions";
import { PRIMARY_MOUSE_BUTTON } from "@/constants/input";

const stylesheet = new CSSStyleSheet();
stylesheet.replaceSync(css);

export interface PopOutAttributes {
  expandable?: "" | "expandable";
}

export default class PopOut extends HTMLElement {
  static readonly observedAttributes: (keyof PopOutAttributes)[] = [
    "expandable",
  ] as const;

  protected readonly dialog: HTMLDialogElement;
  private transition?: ViewTransition;

  constructor() {
    super();

    const shadow = this.attachShadow({ mode: "open", delegatesFocus: true });
    shadow.adoptedStyleSheets = [stylesheet];

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
    name: keyof PopOutAttributes,
    _: string,
    value: string | null,
  ) {
    switch (name) {
      case "expandable":
        if (value === null) {
          this.removeEventListeners();
        } else {
          this.attachEventListeners();
        }
    }
  }

  private attachEventListeners() {
    this.addEventListener("pointerdown", this);
    this.dialog.addEventListener("pointerdown", this);
    this.dialog.addEventListener("focusin", this);
    this.dialog.addEventListener("keydown", this);
  }

  private removeEventListeners() {
    this.removeEventListener("pointerdown", this);
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

  protected isOpen() {
    return this.hasAttribute("open");
  }

  private handlePointerDown(event: PointerEvent) {
    // Prevent pointer events on overlay from bubbling up
    if (this.isOpen()) {
      event.stopPropagation();
    }

    if (event.button !== PRIMARY_MOUSE_BUTTON) {
      return;
    }

    if (this.isOpen()) {
      if (event.target === this.dialog) {
        event.preventDefault();
        this.close();
      }
    } else {
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

    const allowToggle = this.dispatchEvent(
      new ToggleEvent("beforetoggle", {
        oldState: "closed",
        newState: "open",
        cancelable: true,
      }),
    );

    if (!allowToggle) {
      return;
    }

    this.setAttribute("opening", "");

    this.prepareViewTransition();

    this.transition = viewTransition(() => {
      this.setAttribute("open", "");
      this.dialog.setAttribute("role", "dialog");
      this.dialog.showModal();

      this.dispatchEvent(
        new ToggleEvent("toggle", { oldState: "closed", newState: "open" }),
      );
    });
    this.transition.finished.finally(() => {
      this.cleanUpViewTransition();
      delete this.transition;
      this.removeAttribute("opening");
      focusTarget?.focus();
    });
  }

  close() {
    if (!this.isOpen() || this.transition) {
      return;
    }

    const allowToggle = this.dispatchEvent(
      new ToggleEvent("beforetoggle", {
        oldState: "open",
        newState: "closed",
        cancelable: true,
      }),
    );

    if (!allowToggle) {
      return;
    }

    this.setAttribute("closing", "");

    this.prepareViewTransition();

    this.transition = viewTransition(() => {
      this.dialog.close();
      this.dialog.setAttribute("role", "none");
      this.removeAttribute("open");

      this.dispatchEvent(
        new ToggleEvent("toggle", { oldState: "open", newState: "closed" }),
      );
    });
    this.transition.finished.then(() => {
      this.cleanUpViewTransition();
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

  private prepareViewTransition() {
    for (const child of this.children) {
      if (child instanceof HTMLElement && child.id) {
        child.style.viewTransitionName = `popout-item-${child.id}`;
      }
    }
  }

  private cleanUpViewTransition() {
    for (const child of this.children) {
      if (child instanceof HTMLElement && child.id) {
        child.style.viewTransitionName = "";
      }
    }
  }
}
