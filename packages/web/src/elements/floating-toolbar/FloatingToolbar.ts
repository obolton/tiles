// TODO: Implement keyboard interactions:
// https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Roles/menubar_role#keyboard_interactions

import css from "./FloatingToolbar.css?inline";
import ToolbarTab from "./ToolbarTab";
import type { GlobalHTMLAttributes } from "@/jsx/html-attributes";

const stylesheet = new CSSStyleSheet();
stylesheet.replaceSync(css);

const IGNORE_FOCUS_SELECTOR =
  'button, input[type="button"], input[type="checkbox"], input[type="radio"], input[type="file"], swatch-select, tab-item';

export interface FloatingToolbarAttributes extends GlobalHTMLAttributes {
  name?: string;
}

declare global {
  interface HTMLElementTagNameMap {
    "floating-toolbar": FloatingToolbar;
  }
}

declare module "@/jsx/html-attributes" {
  interface HTMLAttributesByTagName {
    "floating-toolbar": FloatingToolbarAttributes;
  }
}

function preventDefault(event: Event) {
  event.preventDefault();
}

export default class FloatingToolbar extends HTMLElement {
  private internals: ElementInternals;
  private tabBar: HTMLElement;
  private mutationObserver: MutationObserver;

  #selectedTabIndex = 0;

  constructor() {
    super();

    this.internals = this.attachInternals();
    this.internals.role = "toolbar";

    const shadow = this.attachShadow({ mode: "open" });
    shadow.adoptedStyleSheets = [stylesheet];

    // Tab bar
    this.tabBar = document.createElement("nav");
    this.tabBar.id = "tab-bar";
    this.tabBar.role = "tablist";
    this.tabBar.ariaLabel = "Toolbar sections";

    // Content container with single slot
    const content = document.createElement("div");
    content.id = "content";
    content.append(document.createElement("slot"));
    shadow.append(this.tabBar, content);

    // Watch for child changes
    this.mutationObserver = new MutationObserver(() => {
      this.buildTabBar();
    });

    // Prevent toolbar items from stealing focus on pointer down
    this.addEventListener("pointerdown", this);
    this.addEventListener("keydown", this);
  }

  connectedCallback() {
    this.mutationObserver.observe(this, { childList: true });
    this.buildTabBar();
    this.restoreTabSelection();
  }

  disconnectedCallback() {
    this.mutationObserver.disconnect();
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

  get selectedTabIndex(): number {
    return this.#selectedTabIndex;
  }

  private get tabs(): NodeListOf<ToolbarTab> {
    return this.querySelectorAll<ToolbarTab>("toolbar-tab");
  }

  private buildTabBar() {
    const tabs = this.tabs;
    this.tabBar.replaceChildren();

    if (tabs.length <= 1) {
      this.internals.states.add("single-tab");
    } else {
      this.internals.states.delete("single-tab");
    }

    // Clamp selected index if tabs were removed
    if (this.#selectedTabIndex >= tabs.length) {
      this.#selectedTabIndex = Math.max(0, tabs.length - 1);
    }

    tabs.forEach((tab, index) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "tab-button";
      button.textContent = tab.label;
      button.role = "tab";
      button.ariaSelected = index === this.#selectedTabIndex ? "true" : "false";
      button.tabIndex = index === this.#selectedTabIndex ? 0 : -1;
      button.dataset.index = String(index);
      button.addEventListener("pointerdown", preventDefault);
      button.addEventListener("click", this);
      this.tabBar.append(button);
    });

    this.updateTabSelection();
  }

  private updateTabSelection() {
    this.tabs.forEach((tab, i) => {
      tab.selected = i === this.#selectedTabIndex;
      tab.classList.toggle("before", i < this.#selectedTabIndex);
      tab.classList.toggle("after", i > this.#selectedTabIndex);
    });
  }

  selectTab(index: number) {
    const tabs = this.tabs;
    if (index === this.#selectedTabIndex || index < 0 || index >= tabs.length) {
      return;
    }

    this.#selectedTabIndex = index;
    this.updateTabSelection();
    this.updateTabButtons();
    this.persistTabSelection();

    this.dispatchEvent(new Event("tabchange"));
  }

  private updateTabButtons() {
    const buttons =
      this.tabBar.querySelectorAll<HTMLButtonElement>(".tab-button");
    buttons.forEach((button, i) => {
      button.ariaSelected = i === this.#selectedTabIndex ? "true" : "false";
      button.tabIndex = i === this.#selectedTabIndex ? 0 : -1;
    });
  }

  private persistTabSelection() {
    const name = this.getAttribute("name") || this.id;
    if (name) {
      sessionStorage.setItem(
        `toolbar-tab:${name}`,
        String(this.#selectedTabIndex),
      );
    }
  }

  private restoreTabSelection() {
    const name = this.getAttribute("name") || this.id;
    if (!name) {
      return;
    }

    const stored = sessionStorage.getItem(`toolbar-tab:${name}`);
    if (stored === null) {
      return;
    }

    const index = parseInt(stored, 10);
    if (Number.isNaN(index) || index < 0 || index >= this.tabs.length) {
      return;
    }

    this.#selectedTabIndex = index;
    this.updateTabSelection();
    this.updateTabButtons();
  }

  private handlePointerDown(event: PointerEvent) {
    // TODO: Rather than preventing focus, we should allow toolbar controls to
    // receive focus normally and rely on selection state (not focus) to
    // determine whether to show or hide toolbars.

    // Prevent toolbar controls from stealing focus
    if (
      event.target instanceof Element &&
      event.target.matches(IGNORE_FOCUS_SELECTOR)
    ) {
      event.preventDefault();
    }

    event.stopPropagation();
  }

  private handleClick(event: PointerEvent) {
    const target = event.target;
    if (
      !(target instanceof HTMLButtonElement) ||
      !target.classList.contains("tab-button")
    ) {
      return;
    }

    const index = parseInt(target.dataset.index ?? "", 10);
    if (!Number.isNaN(index)) {
      this.selectTab(index);
    }
  }

  private handleKeyDown(event: KeyboardEvent) {
    // Only handle keyboard events when focus is in the tab bar
    if (!this.tabBar.contains(document.activeElement)) {
      return;
    }

    const tabs = this.tabs;
    let newIndex = this.#selectedTabIndex;

    switch (event.key) {
      case "ArrowLeft":
        event.preventDefault();
        newIndex = this.#selectedTabIndex - 1;
        if (newIndex < 0) {
          newIndex = tabs.length - 1;
        }
        break;
      case "ArrowRight":
        event.preventDefault();
        newIndex = this.#selectedTabIndex + 1;
        if (newIndex >= tabs.length) {
          newIndex = 0;
        }
        break;
      case "Home":
        event.preventDefault();
        newIndex = 0;
        break;
      case "End":
        event.preventDefault();
        newIndex = tabs.length - 1;
        break;
      default:
        return;
    }

    this.selectTab(newIndex);

    // Focus the new tab button
    const buttons =
      this.tabBar.querySelectorAll<HTMLButtonElement>(".tab-button");
    buttons[newIndex]?.focus();
  }
}

customElements.define("floating-toolbar", FloatingToolbar);
