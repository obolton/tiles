import css from "./PopOut.css?inline";
import { viewTransition } from "@/utils/transitions";
import { PRIMARY_MOUSE_BUTTON } from "@/constants/input";
import arrowDownIcon from "@/icons/arrow-down.svg?raw";
import type { GlobalHTMLAttributes } from "@/jsx/html-attributes";

const stylesheet = new CSSStyleSheet();
stylesheet.replaceSync(css);

export interface PopOutAttributes extends GlobalHTMLAttributes {
  disabled?: "" | "disabled";
  expandable?: "expandable";
}

declare global {
  interface HTMLElementTagNameMap {
    "pop-out": PopOut;
  }
}

declare module "@/jsx/html-attributes" {
  interface HTMLAttributesByTagName {
    "pop-out": PopOutAttributes;
  }
}

export default class PopOut extends HTMLElement {
  static readonly observedAttributes: (keyof PopOutAttributes)[] = [
    "disabled",
  ] as const;

  protected readonly internals: ElementInternals;
  protected readonly contents: HTMLElement;
  private expandButton: HTMLButtonElement | null = null;
  private resizeObserver: ResizeObserver;

  #disabled = true;

  get disabled() {
    return this.#disabled;
  }

  set disabled(value: boolean) {
    if (value) {
      this.disable();
    } else {
      this.enable();
    }
  }

  protected get isOpen() {
    return this.internals.states.has("open");
  }

  protected get isTransitioning() {
    return this.internals.states.has("transitioning");
  }

  protected get isOverflowing() {
    return this.contents.scrollHeight > this.contents.clientHeight;
  }

  constructor() {
    super();

    this.internals = this.attachInternals();

    const shadow = this.attachShadow({ mode: "open" });
    shadow.adoptedStyleSheets = [stylesheet];

    this.contents = document.createElement("div");
    this.contents.id = "contents";
    this.contents.setAttribute("part", "contents");
    this.contents.append(document.createElement("slot"));
    shadow.append(this.contents);

    this.resizeObserver = new ResizeObserver(
      this.resizeObserverCallback.bind(this),
    );
  }

  connectedCallback() {
    if (!this.hasAttribute("disabled")) {
      this.enable();
    }
    this.resizeObserver.observe(this.contents);
  }

  disconnectedCallback() {
    this.disable();
    this.resizeObserver.disconnect();
  }

  attributeChangedCallback(
    name: keyof PopOutAttributes,
    _: string | null,
    value: string | null,
  ) {
    switch (name) {
      case "disabled":
        this.disabled = value !== null;
        break;
    }
  }

  handleEvent(event: Event) {
    switch (event.type) {
      case "pointerdown":
        return this.handlePointerDown(event as PointerEvent);
      case "click":
        return this.handleClick(event as PointerEvent);
      case "keydown":
        return this.handleKeyDown(event as KeyboardEvent);
    }
  }

  private resizeObserverCallback() {
    if (this.isOverflowing) {
      this.internals.states.add("overflowing");
      this.showExpandButton();
    } else if (!this.isOpen) {
      this.internals.states.delete("overflowing");
      this.hideExpandButton();
    }
  }

  private enable() {
    this.#disabled = false;
    this.addEventListener("pointerdown", this);
    this.addEventListener("keydown", this);
  }

  private disable() {
    this.#disabled = true;
    this.removeEventListener("pointerdown", this);
    this.removeEventListener("keydown", this);

    if (this.isOpen) {
      this.close();
    }
  }

  private handlePointerDown(event: PointerEvent) {
    const { currentTarget, button, defaultPrevented } = event;

    if (currentTarget === this.expandButton) {
      event.stopPropagation();
      return;
    }

    if (button !== PRIMARY_MOUSE_BUTTON) {
      return;
    }

    if (this.isOpen) {
      if (currentTarget === this) {
        event.stopPropagation();
      }
      if (currentTarget === window && !defaultPrevented) {
        this.close();
      }
    } else if (!this.isOpen && this.isOverflowing) {
      event.stopPropagation();
      this.open();
    }
  }

  private handleClick(event: PointerEvent) {
    if (event.currentTarget === this.expandButton) {
      event.stopPropagation();
      if (this.isOpen) {
        this.close();
      } else if (!this.isOpen && this.isOverflowing) {
        this.open();
      }
    }
  }

  private handleKeyDown(event: KeyboardEvent) {
    if (event.key === "Escape" && this.isOpen) {
      event.preventDefault();
      this.close();
    } else if (
      event.key === "Enter" &&
      !event.defaultPrevented &&
      !this.isOpen &&
      this.isOverflowing
    ) {
      event.preventDefault();
      this.open();
    }
  }

  private showExpandButton() {
    if (this.expandButton) {
      return;
    }

    const button = document.createElement("button");
    button.setAttribute("part", "button");
    button.id = "expand";
    button.type = "button";
    button.ariaLabel = "Expand";
    button.innerHTML = arrowDownIcon;
    button.addEventListener("click", this);
    button.addEventListener("pointerdown", this);
    this.contents.append(button);
    this.expandButton = button;
  }

  private hideExpandButton() {
    this.expandButton?.remove();
    this.expandButton = null;
  }

  open() {
    if (this.isOpen || this.isTransitioning) {
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

    const rect = this.contents.getBoundingClientRect();
    this.internals.states.add("transitioning");

    void viewTransition(() => {
      this.internals.states.add("open");

      this.contents.style.minWidth = rect.width + "px";
      this.contents.style.minHeight = rect.height + "px";

      if (this.expandButton) {
        this.expandButton.ariaLabel = "Collapse";
      }

      this.dispatchEvent(
        new ToggleEvent("toggle", { oldState: "closed", newState: "open" }),
      );
    }).finished.finally(() => {
      this.internals.states.delete("transitioning");
    });

    window.addEventListener("pointerdown", this);
  }

  close() {
    if (!this.isOpen || this.isTransitioning) {
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

    this.internals.states.add("transitioning");

    void viewTransition(() => {
      this.internals.states.delete("open");
      this.contents.style.minWidth = "";
      this.contents.style.minHeight = "";

      if (this.expandButton) {
        this.expandButton.ariaLabel = "Expand";
      }

      this.dispatchEvent(
        new ToggleEvent("toggle", { oldState: "open", newState: "closed" }),
      );
    }).finished.finally(() => {
      this.internals.states.delete("transitioning");

      if (document.activeElement && this.contains(document.activeElement)) {
        this.focus();
      }
    });

    window.removeEventListener("pointerdown", this);
  }
}

customElements.define("pop-out", PopOut);
