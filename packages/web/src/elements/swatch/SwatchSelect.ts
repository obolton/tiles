import css from "./SwatchSelect.css?inline";
import closeIcon from "@/icons/close.svg?raw";
import PopoverMenu from "@/elements/menu/PopoverMenu";
import { escapeUTF8 } from "entities";

const stylesheet = new CSSStyleSheet();
stylesheet.replaceSync(css);

export interface SwatchSelectAttributes {
  value?: string;
  orientation?: "horizontal" | "vertical";
  align?: "left" | "center" | "right" | "auto";
}

export default class SwatchSelect extends HTMLElement {
  static readonly observedAttributes: (keyof SwatchSelectAttributes)[] = [
    "value",
    "align",
  ] as const;

  value: string | null = "";

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
    this.button.ariaLabel = "Close";
    this.button.ariaPressed = "false";
    this.button.addEventListener("click", this);
    this.button.innerHTML = closeIcon;

    const iconSlot = document.createElement("slot");
    iconSlot.name = "icon";
    this.button.append(iconSlot);

    this.items = document.createElement("popover-menu") as PopoverMenu;
    this.items.id = "items";
    this.items.part = "items";
    this.items.anchorElement = this.button;
    this.items.addEventListener("beforetoggle", this, { passive: true });
    this.items.addEventListener("toggle", this, { passive: true });
    this.items.addEventListener("click", this);
    this.items.append(document.createElement("slot"));

    shadow.append(this.button, this.items);
  }

  attributeChangedCallback(
    name: keyof SwatchSelectAttributes,
    _: string | null,
    value: string | null,
  ) {
    switch (name) {
      case "value":
        this.value = value;
        break;
      case "align":
        if (value === "left" || value === "center" || value === "right") {
          this.items.align = value;
        } else {
          this.items.align = "auto";
        }
        break;
    }
  }

  handleEvent(event: Event) {
    switch (event.type) {
      case "beforetoggle":
        return this.handleBeforeToggle(event as ToggleEvent);
      case "toggle":
        return this.handleToggle(event as ToggleEvent);
      case "click":
        return this.handleClick(event as MouseEvent);
    }
  }

  private handleBeforeToggle(event: ToggleEvent) {
    if (event.newState === "open") {
      if (this.value) {
        this.querySelector(
          `swatch-item[value="${escapeUTF8(this.value)}"]`,
        )?.setAttribute("selected", "");
      }
    } else {
      this.querySelector("swatch-item[selected]")?.removeAttribute("selected");
    }
  }

  private handleToggle(event: ToggleEvent) {
    const open = event.newState === "open";

    this.open = open;
    this.ariaExpanded = open ? "true" : "false";
    this.button.ariaPressed = open ? "true" : "false";
  }

  private handleClick(event: MouseEvent) {
    if (event.currentTarget === this.button) {
      if (this.open) {
        this.hide();
      } else {
        this.show();
      }
      return;
    }

    const target = event.target;
    if (!(target instanceof Element)) {
      return;
    }
    const item = target.closest("swatch-item");
    if (!item) {
      return;
    }
    this.value = item.getAttribute("value") ?? "";
    this.dispatchEvent(new Event("change", { bubbles: true }));
    this.items.hidePopover();
  }

  // Open and close

  show() {
    if (this.open) {
      return;
    }
    this.open = true;
    this.ariaExpanded = "true";
    this.button.ariaPressed = "true";
    this.items.showPopover();
  }

  hide() {
    if (!this.open) {
      return;
    }
    this.open = false;
    this.ariaExpanded = "false";
    this.button.ariaPressed = "false";
    this.items.hidePopover();
  }
}

customElements.define("swatch-select", SwatchSelect);
