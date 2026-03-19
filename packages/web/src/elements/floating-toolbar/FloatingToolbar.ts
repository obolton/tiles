import css from "./FloatingToolbar.css?inline";
import ToolbarTab from "./ToolbarTab";
import KeyboardNavigation from "@/utils/keyboard";
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

  interface HTMLElementEventMap {
    tabchange: Event;
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
  private tabBarNav: KeyboardNavigation;
  private itemsNav: KeyboardNavigation;
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
    this.tabBar.addEventListener("pointerdown", this);
    this.tabBar.addEventListener("focusin", this);

    // Content container with single slot
    const content = document.createElement("div");
    content.id = "content";
    content.append(document.createElement("slot"));
    shadow.append(this.tabBar, content);

    // Keyboard navigation for tab bar and toolbar items
    this.tabBarNav = new KeyboardNavigation(this.tabBar, {
      selector: ".tab-button",
      orientation: "horizontal",
    });
    this.itemsNav = new KeyboardNavigation(this, {
      selector:
        'toolbar-tab[selected] > [role="group"] > :is(button, list-select)',
      orientation: "horizontal",
    });

    // Watch for child changes
    this.mutationObserver = new MutationObserver(() => {
      this.buildTabBar();
    });

    // Prevent toolbar items from stealing focus on pointer down
    this.addEventListener("pointerdown", this);

    // Cross-navigation between tab bar and toolbar items
    this.tabBar.addEventListener("keydown", this);
    this.addEventListener("keydown", this);
  }

  connectedCallback() {
    this.mutationObserver.observe(this, { childList: true });
    this.tabBarNav.attach();
    this.itemsNav.attach();
    this.buildTabBar();
    this.restoreTabSelection();
  }

  disconnectedCallback() {
    this.mutationObserver.disconnect();
    this.tabBarNav.detach();
    this.itemsNav.detach();
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
      case "keydown":
        return this.handleKeyDown(event as KeyboardEvent);
      case "click":
      case "focusin":
        return this.handleTabSelect(event);
    }
  }

  // Tabs

  private get tabs(): ToolbarTab[] {
    return Array.from(this.querySelectorAll<ToolbarTab>("toolbar-tab"));
  }

  private get tabButtons(): HTMLButtonElement[] {
    return Array.from(
      this.tabBar.querySelectorAll<HTMLButtonElement>(".tab-button"),
    );
  }

  private getTabByName(name: string): ToolbarTab | null {
    return this.querySelector<ToolbarTab>(
      `toolbar-tab[name="${CSS.escape(name)}"]`,
    );
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
    this.updateSelection();
    this.persistTabSelection();

    this.dispatchEvent(new Event("tabchange"));
  }

  selectTab(name: string | null) {
    this.selectedTab = name ? this.getTabByName(name) : null;
  }

  // Tab bar

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

    for (const tab of tabs) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "tab-button";
      button.textContent = tab.label;
      button.role = "tab";
      button.dataset.tabName = tab.name;
      button.addEventListener("click", this);
      this.tabBar.append(button);
    }

    this.updateSelection();
  }

  private updateSelection() {
    const tabs = this.tabs;
    const tabButtons = this.tabButtons;
    const selectedIndex = this.#selectedTab
      ? tabs.indexOf(this.#selectedTab)
      : -1;

    // Update tab panels
    tabs.forEach((tab, i) => {
      tab.selected = i === selectedIndex;
      tab.classList.toggle("before", i < selectedIndex);
      tab.classList.toggle("after", i > selectedIndex);
    });

    // Update tab bar buttons
    tabButtons.forEach((button, i) => {
      button.ariaSelected = i === selectedIndex ? "true" : "false";
    });
    this.tabBarNav.setActiveItem(tabButtons[selectedIndex] ?? null);

    // Update toolbar items
    this.itemsNav.update();
  }

  // Persistence

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

    const tab = this.getTabByName(storedTabName);
    if (tab) {
      this.#selectedTab = tab;
      this.updateSelection();
    }
  }

  // Event handlers

  private handleKeyDown(event: KeyboardEvent) {
    if (event.defaultPrevented) {
      return;
    }

    if (
      event.key === "ArrowDown" &&
      event.target instanceof Element &&
      event.target.closest(".tab-button")
    ) {
      event.preventDefault();
      this.itemsNav.activeItem?.focus();
    } else if (
      event.key === "ArrowUp" &&
      event.target instanceof Element &&
      event.target.closest("toolbar-tab[selected]")
    ) {
      event.preventDefault();
      this.tabBarNav.activeItem?.focus();
    }
  }

  private handlePointerDown(event: PointerEvent) {
    // Prevent buttons from stealing focus
    if (
      event.target instanceof Element &&
      event.target.matches(
        'button:not([popovertarget]), input[type="button"]:not([popovertarget])',
      )
    ) {
      event.preventDefault();
    }

    event.stopPropagation();
  }

  private handleTabSelect(event: Event) {
    const target = event.target;
    if (
      !(target instanceof HTMLButtonElement) ||
      !target.classList.contains("tab-button")
    ) {
      return;
    }

    const index = this.tabButtons.indexOf(target);
    const tab = this.tabs[index];
    if (tab) {
      this.selectedTab = tab;
    }
  }
}

customElements.define("floating-toolbar", FloatingToolbar);
