import css from "./PopOut.css?inline";
import { viewTransition } from "@/utils/transitions";
import { PRIMARY_MOUSE_BUTTON } from "@/constants/input";
import closeIcon from "@/icons/close.svg?raw";

const stylesheet = new CSSStyleSheet();
stylesheet.replaceSync(css);

export interface PopOutAttributes {
  disabled?: "" | "disabled";
}

export default class PopOut extends HTMLElement {
  static readonly observedAttributes: (keyof PopOutAttributes)[] = [
    "disabled",
  ] as const;

  protected readonly internals: ElementInternals;
  protected readonly container: HTMLElement;
  protected readonly contents: HTMLElement;
  private closeButton: HTMLButtonElement | null = null;
  private focusTarget: HTMLElement | null = null;
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

    this.container = document.createElement("div");
    this.container.id = "container";
    this.container.popover = "manual";
    this.container.setAttribute("part", "container");

    this.contents = document.createElement("div");
    this.contents.id = "contents";
    this.contents.setAttribute("part", "contents");
    this.contents.append(document.createElement("slot"));
    this.container.append(this.contents);

    this.resizeObserver = new ResizeObserver(
      this.resizeObserverCallback.bind(this),
    );

    shadow.append(this.container);
  }

  connectedCallback() {
    if (!this.hasAttribute("disabled")) {
      this.enable();
    }
    this.resizeObserver.observe(this.container);
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
      case "focusin":
        return this.handleFocusIn(event as FocusEvent);
      case "keydown":
        return this.handleKeyDown(event as KeyboardEvent);
    }
  }

  private resizeObserverCallback() {
    if (this.isOverflowing) {
      this.internals.states.add("overflowing");
    } else {
      this.internals.states.delete("overflowing");
    }
  }

  private enable() {
    this.#disabled = false;
    this.addEventListener("pointerdown", this);
    this.addEventListener("keydown", this);
    this.container.addEventListener("focusin", this);
  }

  private disable() {
    this.#disabled = true;
    this.removeEventListener("pointerdown", this);
    this.removeEventListener("keydown", this);
    this.container.removeEventListener("focusin", this);

    if (this.isOpen) {
      this.close();
    }
  }

  private handlePointerDown(event: PointerEvent) {
    const { currentTarget, button, defaultPrevented } = event;

    if (currentTarget === this.closeButton) {
      event.preventDefault();
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
      event.preventDefault();
      setTimeout(() => this.open(), 0);
    }
  }

  private handleClick(event: PointerEvent) {
    const { currentTarget } = event;

    if (currentTarget === this.closeButton) {
      event.stopPropagation();
      this.close();
    }
  }

  private handleFocusIn(event: FocusEvent) {
    if (!this.isTransitioning && event.target instanceof HTMLElement) {
      this.focusTarget = event.target;
    }
  }

  private handleKeyDown(event: KeyboardEvent) {
    if (event.key === "Escape" && this.isOpen) {
      event.preventDefault();
      this.close();
    } else if (event.key === "Enter" && !this.isOpen && this.isOverflowing) {
      event.preventDefault();
      this.open();
    }
  }

  private showCloseButton() {
    if (this.closeButton) {
      return;
    }

    const button = document.createElement("button");
    button.setAttribute("part", "close");
    button.id = "close";
    button.type = "button";
    button.ariaLabel = "Close";
    button.innerHTML = closeIcon;
    button.addEventListener("click", this);
    button.addEventListener("pointerdown", this);
    this.container.append(button);
    this.closeButton = button;
  }

  private hideCloseButton() {
    this.closeButton?.remove();
    this.closeButton = null;
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

    const rect = this.container.getBoundingClientRect();
    this.internals.states.add("transitioning");

    void viewTransition(() => {
      this.internals.states.add("open");

      this.container.style.left = rect.left + "px";
      this.container.style.minWidth = rect.width + "px";
      this.container.style.minHeight = rect.height + "px";
      this.container.showPopover();
      this.showCloseButton();

      // Fix popover ordering
      const popovers = document.querySelectorAll<HTMLElement>(
        "[popover]:popover-open",
      );
      popovers.forEach((popover) => {
        popover.hidePopover();
        popover.showPopover();
      });

      if (this.focusTarget) {
        this.focusTarget?.focus();
        this.focusTarget = null;
      } else {
        this.querySelector<HTMLElement>("[tabindex]")?.focus();
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
      this.container.style.left = "";
      this.container.style.minWidth = "";
      this.container.style.minHeight = "";
      this.container.hidePopover();
      this.hideCloseButton();

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
