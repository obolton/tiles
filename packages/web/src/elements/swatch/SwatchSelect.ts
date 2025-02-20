import css from "./SwatchSelect.css?inline";
import closeIcon from "@/icons/close.svg";
import {
  move,
  fadeIn,
  fadeOut,
  DEFAULT_TIMING,
  SPRING,
} from "@/utils/animation/effects";

const stylesheet = new CSSStyleSheet();
stylesheet.replaceSync(css);

const TIMING: EffectTiming = {
  ...DEFAULT_TIMING,
  fill: "forwards",
};
const OVERLAP = 8;

export interface SwatchSelectAttributes {
  value?: string;
  direction?: "left" | "right";
  onchange?: (event: globalThis.Event) => void;
  ontoggle?: (event: globalThis.ToggleEvent) => void;
}

export default class SwatchSelect extends HTMLElement {
  public value: string = "";

  private open = false;
  private button: HTMLButtonElement;
  private items: HTMLElement;
  private itemsSlot: HTMLSlotElement;

  constructor() {
    super();

    const shadow = this.attachShadow({ mode: "closed" });
    shadow.adoptedStyleSheets = [stylesheet];

    this.button = document.createElement("button");
    this.button.setAttribute("part", "button");
    this.button.type = "button";
    this.button.ariaPressed = "false";
    this.button.addEventListener("click", this.toggle.bind(this));

    const icon = document.createElement("img");
    icon.src = closeIcon.src;
    icon.alt = "Close";
    this.button.append(icon);

    const iconSlot = document.createElement("slot");
    iconSlot.name = "icon";
    this.button.append(iconSlot);

    this.items = document.createElement("div");
    this.items.id = "items";
    this.items.setAttribute("part", "items");
    this.items.classList.add("hidden");
    this.items.addEventListener("click", this.itemClicked.bind(this));

    this.itemsSlot = document.createElement("slot");
    this.items.append(this.itemsSlot);

    shadow.append(this.button, this.items);
  }

  toggle() {
    this.open = !this.open;

    const direction = this.getAttribute("direction") === "left" ? -1 : 1;

    if (this.open) {
      this.ariaExpanded = "true";
      this.button.ariaPressed = "true";
      this.items.classList.remove("hidden");

      fadeIn(this.items, { timing: TIMING });

      const items = this.itemsSlot.assignedElements();
      items.forEach((item, i) =>
        move(item, {
          fromX: `${(items.length - i) * -100 * direction}%`,
          toX: `${(items.length - i - 1) * -OVERLAP * direction + 20 * direction}px`,
          timing: { ...SPRING, fill: "both" },
        }),
      );

      this.dispatchEvent(
        new ToggleEvent("toggle", { oldState: "closed", newState: "open" }),
      );
    } else {
      this.ariaExpanded = "false";
      this.button.ariaPressed = "false";

      fadeOut(this.items, { timing: TIMING });

      const elements = this.itemsSlot.assignedElements();
      Promise.all(
        elements.map((item, i) =>
          move(item, {
            fromX: `${(elements.length - i - 1) * -OVERLAP * direction + 20 * direction}px`,
            toX: `${(elements.length - i) * -100 * direction}%`,
            timing: { ...SPRING, fill: "both" },
          }),
        ),
      ).then(() => this.items.classList.add("hidden"));

      this.dispatchEvent(
        new ToggleEvent("toggle", { oldState: "open", newState: "closed" }),
      );
    }
  }

  private itemClicked(event: MouseEvent) {
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
