import css from "./SwatchSelect.css?inline";
import deleteIcon from "@/icons/delete.svg";
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

export default class SwatchSelect extends HTMLElement {
  static observedAttributes = ["direction"] as const;

  public value: string = "";

  private open = false;
  private shadow: ShadowRoot;
  private button: HTMLButtonElement;
  private items: HTMLElement;
  private itemsSlot: HTMLSlotElement;

  constructor() {
    super();

    this.shadow = this.attachShadow({ mode: "closed" });
    this.shadow.adoptedStyleSheets = [stylesheet];

    this.button = document.createElement("button");
    this.button.setAttribute("type", "button");
    this.button.setAttribute("part", "button");
    this.button.addEventListener("click", this.toggle.bind(this));

    const icon = document.createElement("img");
    icon.src = deleteIcon.src;
    icon.alt = "Close";
    this.button.append(icon);

    const iconSlot = document.createElement("slot");
    iconSlot.setAttribute("name", "icon");
    this.button.append(iconSlot);

    this.items = document.createElement("div");
    this.items.id = "items";
    this.items.setAttribute("part", "items");
    this.items.classList.add("hidden");
    this.items.addEventListener("click", this.itemClicked.bind(this));

    this.itemsSlot = document.createElement("slot");
    this.items.append(this.itemsSlot);

    this.shadow.append(this.button, this.items);
  }

  toggle() {
    this.open = !this.open;

    const direction = this.getAttribute("direction") === "left" ? -1 : 1;

    if (this.open) {
      this.setAttribute("aria-pressed", "true");
      this.button.setAttribute("aria-pressed", "true");
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
      this.removeAttribute("aria-pressed");
      this.button.removeAttribute("aria-pressed");

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
