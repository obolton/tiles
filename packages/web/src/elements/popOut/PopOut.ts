import css from "./PopOut.css?inline";
import { viewTransition } from "@/utils/transitions";
import { PRIMARY_MOUSE_BUTTON } from "@/constants/input";

const stylesheet = new CSSStyleSheet();
stylesheet.replaceSync(css);

export interface PopOutAttributes {
  expandable?: "" | "expandable";
  ontoggle?: (event: globalThis.ToggleEvent) => void;
  onbeforetoggle?: (event: globalThis.ToggleEvent) => void;
}

export default class PopOut extends HTMLElement {
  static readonly observedAttributes: (keyof PopOutAttributes)[] = [
    "expandable",
  ] as const;

  protected readonly dialog: HTMLDialogElement;
  private transition?: ViewTransition;
  private focusTarget: HTMLElement | null = null;

  constructor() {
    super();

    const shadow = this.attachShadow({ mode: "open" });
    shadow.adoptedStyleSheets = [stylesheet];

    const closeButton = document.createElement("button");
    closeButton.setAttribute("part", "close");
    closeButton.id = "close";
    closeButton.type = "button";
    closeButton.ariaLabel = "Close";
    closeButton.addEventListener("click", (event) => {
      event.stopPropagation();
      this.close();
    });

    this.dialog = document.createElement("dialog");
    this.dialog.setAttribute("part", "dialog");
    this.dialog.role = "none";
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
          if (this.isOpen()) {
            this.close();
          }
        } else {
          this.attachEventListeners();
        }
    }
  }

  private attachEventListeners() {
    this.addEventListener("pointerdown", this);
    this.addEventListener("keydown", this);
    this.dialog.addEventListener("focusin", this);
  }

  private removeEventListeners() {
    this.removeEventListener("pointerdown", this);
    this.removeEventListener("keydown", this);
    this.dialog.removeEventListener("focusin", this);
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

  protected get isOverflowing() {
    return this.dialog.scrollHeight > this.dialog.clientHeight;
  }

  private handlePointerDown(event: PointerEvent) {
    if (event.button !== PRIMARY_MOUSE_BUTTON) {
      return;
    }

    if (this.isOpen() && event.target === this) {
      event.stopPropagation();
      event.preventDefault();
      this.close();
    } else if (!this.isOpen() && this.isOverflowing) {
      event.stopPropagation();
      event.preventDefault();
      setTimeout(() => this.open(), 0);
    }
  }

  private handleFocusIn(event: FocusEvent) {
    if (!this.transition && event.target instanceof HTMLElement) {
      this.focusTarget = event.target;
    }
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

  open() {
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
      this.dialog.role = "dialog";
      this.dialog.showModal();

      if (this.focusTarget) {
        this.focusTarget?.focus();
        this.focusTarget = null;
      } else {
        this.querySelector<HTMLElement>("[tabindex]")?.focus();
      }

      this.dispatchEvent(
        new ToggleEvent("toggle", { oldState: "closed", newState: "open" }),
      );
    });
    this.transition.finished.finally(() => {
      this.cleanUpViewTransition();
      delete this.transition;
      this.removeAttribute("opening");
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
      this.dialog.role = "none";
      this.removeAttribute("open");

      this.dispatchEvent(
        new ToggleEvent("toggle", { oldState: "open", newState: "closed" }),
      );
    });
    this.transition.finished.then(() => {
      this.cleanUpViewTransition();
      delete this.transition;
      this.removeAttribute("closing");

      if (document.activeElement && this.contains(document.activeElement)) {
        this.focus();
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

customElements.define("pop-out", PopOut);
