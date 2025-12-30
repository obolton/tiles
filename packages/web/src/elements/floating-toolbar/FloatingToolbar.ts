// TODO: Implement keyboard interactions:
// https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Roles/menubar_role#keyboard_interactions

import css from "./FloatingToolbar.css?inline";
import ToolbarTab from "./ToolbarTab";
import type { GlobalHTMLAttributes } from "@/jsx/html-attributes";

const stylesheet = new CSSStyleSheet();
stylesheet.replaceSync(css);

export interface FloatingToolbarAttributes extends GlobalHTMLAttributes {
  name?: string;
  selectedtab?: string | null;
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

export default class FloatingToolbar extends HTMLElement {
  static readonly observedAttributes: (keyof FloatingToolbarAttributes)[] = [
    "selectedtab",
  ] as const;

  private internals: ElementInternals;
  private tabBar: HTMLElement;
  private mutationObserver: MutationObserver;

  #selectedTab: ToolbarTab | null = null;

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

  attributeChangedCallback(
    name: keyof FloatingToolbarAttributes,
    _: string | null,
    value: string | null,
  ) {
    switch (name) {
      case "selectedtab":
        this.selectTab(value);
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

  private get tabs(): ToolbarTab[] {
    return Array.from(this.querySelectorAll<ToolbarTab>("toolbar-tab"));
  }

  private getTabByName(name: string): ToolbarTab | null {
    return this.querySelector<ToolbarTab>(
      `toolbar-tab[name="${CSS.escape(name)}"]`,
    );
  }

  private get selectedTabIndex(): number {
    if (!this.#selectedTab) {
      return 0;
    }
    const index = this.tabs.indexOf(this.#selectedTab);
    return index === -1 ? 0 : index;
  }

  get selectedTab(): ToolbarTab | null {
    return this.#selectedTab;
  }

  set selectedTab(tab: ToolbarTab | null) {
    if (tab === this.#selectedTab) {
      return;
    }

    if (tab && !this.contains(tab)) {
      throw new Error("Tab element is not a child of the toolbar");
    }

    this.#selectedTab = tab;
    this.updateTabSelection();
    this.updateTabButtons();
    this.persistTabSelection();

    this.dispatchEvent(new Event("tabchange"));
  }

  private buildTabBar() {
    const tabs = this.tabs;
    this.tabBar.replaceChildren();

    if (tabs.length <= 1) {
      this.internals.states.add("single-tab");
    } else {
      this.internals.states.delete("single-tab");
    }

    if (!this.#selectedTab || !tabs.includes(this.#selectedTab)) {
      this.#selectedTab = tabs[0] ?? null;
    }

    tabs.forEach((tab) => {
      const isSelected = tab === this.#selectedTab;
      const button = document.createElement("button");
      button.type = "button";
      button.className = "tab-button";
      button.textContent = tab.label;
      button.role = "tab";
      button.ariaSelected = isSelected ? "true" : "false";
      button.tabIndex = isSelected ? 0 : -1;
      button.dataset.tabName = tab.name;
      button.addEventListener("click", this);
      this.tabBar.append(button);
    });

    this.updateTabSelection();
  }

  private updateTabSelection() {
    const selectedIndex = this.selectedTabIndex;
    this.tabs.forEach((tab, i) => {
      tab.selected = i === selectedIndex;
      tab.classList.toggle("before", i < selectedIndex);
      tab.classList.toggle("after", i > selectedIndex);
    });
  }

  selectTab(name: string | null) {
    this.selectedTab = name ? this.getTabByName(name) : null;
  }

  private updateTabButtons() {
    const buttons =
      this.tabBar.querySelectorAll<HTMLButtonElement>(".tab-button");
    buttons.forEach((button) => {
      const isSelected = button.dataset.tabName === this.#selectedTab?.name;
      button.ariaSelected = isSelected ? "true" : "false";
      button.tabIndex = isSelected ? 0 : -1;
    });
  }

  private persistTabSelection() {
    const toolbarName = this.getAttribute("name") || this.id;
    if (toolbarName && this.#selectedTab?.name) {
      sessionStorage.setItem(
        `toolbar-tab:${toolbarName}`,
        this.#selectedTab.name,
      );
    }
  }

  private restoreTabSelection() {
    const toolbarName = this.getAttribute("name") || this.id;
    if (!toolbarName) {
      return;
    }

    const storedTabName = sessionStorage.getItem(`toolbar-tab:${toolbarName}`);
    if (storedTabName === null) {
      return;
    }

    // Only restore if the tab exists
    const tab = this.getTabByName(storedTabName);
    if (tab) {
      this.#selectedTab = tab;
      this.updateTabSelection();
      this.updateTabButtons();
    }
  }

  private handlePointerDown(event: PointerEvent) {
    // Prevent buttons from stealing focus
    if (
      event.target instanceof Element &&
      event.target.matches('button, input[type="button"]')
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

    const tabName = target.dataset.tabName;
    if (tabName) {
      this.selectTab(tabName);
    }
  }

  private handleKeyDown(event: KeyboardEvent) {
    // Only handle keyboard events when focus is in the tab bar
    if (!this.tabBar.contains(document.activeElement)) {
      return;
    }

    const tabs = this.tabs;
    const currentIndex = this.selectedTabIndex;
    let newIndex = currentIndex;

    switch (event.key) {
      case "ArrowLeft":
        event.preventDefault();
        newIndex = currentIndex - 1;
        if (newIndex < 0) {
          newIndex = tabs.length - 1;
        }
        break;
      case "ArrowRight":
        event.preventDefault();
        newIndex = currentIndex + 1;
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

    const newTab = tabs[newIndex];
    if (newTab) {
      this.selectedTab = newTab;

      // Focus the new tab button
      const buttons =
        this.tabBar.querySelectorAll<HTMLButtonElement>(".tab-button");
      buttons[newIndex]?.focus();
    }
  }
}

customElements.define("floating-toolbar", FloatingToolbar);
