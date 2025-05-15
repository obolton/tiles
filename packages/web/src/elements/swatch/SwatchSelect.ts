import css from "./SwatchSelect.css?inline";
import closeIcon from "@/icons/close.svg";
import PopoverMenu from "@/elements/menu/PopoverMenu";

const stylesheet = new CSSStyleSheet();
stylesheet.replaceSync(css);

export interface SwatchSelectAttributes {
  value?: string;
  orientation?: "horizontal" | "vertical";
  onchange?: (event: globalThis.Event) => void;
  ontoggle?: (event: globalThis.ToggleEvent) => void;
}

export default class SwatchSelect extends HTMLElement {
  value: string = "";

  private open = false;
  private button: HTMLButtonElement;
  private items: PopoverMenu;

  constructor() {
    super();

    const shadow = this.attachShadow({ mode: "closed" });
    shadow.adoptedStyleSheets = [stylesheet];

    this.button = document.createElement("button");
    this.button.part = "button";
    this.button.type = "button";
    this.button.ariaPressed = "false";
    this.button.addEventListener("click", this);

    const icon = document.createElement("img");
    icon.src = closeIcon;
    icon.alt = "Close";
    this.button.append(icon);

    const iconSlot = document.createElement("slot");
    iconSlot.name = "icon";
    this.button.append(iconSlot);

    this.items = document.createElement("popover-menu") as PopoverMenu;
    this.items.id = "items";
    this.items.part = "items";
    this.items.anchorElement = this.button;
    this.items.addEventListener("click", this);

    const slot = document.createElement("slot");
    this.items.append(slot);

    shadow.append(this.button, this.items);
  }

  handleEvent(event: Event) {
    switch (event.type) {
      case "click":
        return this.handleClick(event as MouseEvent);
    }
  }

  toggle() {
    this.open = !this.open;

    if (this.open) {
      this.ariaExpanded = "true";
      this.button.ariaPressed = "true";
      this.items.showPopover();
      this.dispatchEvent(
        new ToggleEvent("toggle", { oldState: "closed", newState: "open" }),
      );
    } else {
      this.ariaExpanded = "false";
      this.button.ariaPressed = "false";
      this.items.hidePopover();
      this.dispatchEvent(
        new ToggleEvent("toggle", { oldState: "open", newState: "closed" }),
      );
    }
  }

  private handleClick(event: MouseEvent) {
    if (event.currentTarget === this.button) {
      this.toggle();
      return;
    }

    const target = event.target;
    if (!(target instanceof Element)) {
      return;
    }
    const item = target.closest("swatch-item");
    if (!item || !item.hasAttribute("value")) {
      return;
    }
    this.value = item.getAttribute("value") ?? "";
    this.dispatchEvent(new Event("change", { bubbles: true }));
    this.toggle();
  }
}

customElements.define("swatch-select", SwatchSelect);
