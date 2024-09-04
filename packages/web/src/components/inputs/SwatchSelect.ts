import stylesheet from "./SwatchSelect.css?url";
import deleteIcon from "@/icons/delete.svg";
import { move, fadeIn, fadeOut } from "@/utils/animation/effects";

const TIMING: EffectTiming = {
  duration: 350,
  easing: "ease",
  fill: "forwards",
};
const OVERLAP = 8;

export default class SwatchSelect extends HTMLElement {
  public value: string = "";

  private open = false;
  private shadow: ShadowRoot;
  private button: HTMLButtonElement;
  private items: HTMLElement;
  private itemsSlot: HTMLSlotElement;

  constructor() {
    super();

    this.shadow = this.attachShadow({ mode: "closed" });
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = stylesheet;

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

    this.shadow.append(link, this.button, this.items);
  }

  toggle() {
    this.open = !this.open;

    if (this.open) {
      this.button.setAttribute("aria-pressed", "true");
      this.items.classList.remove("hidden");

      fadeIn(this.items, { timing: TIMING });

      const items = this.itemsSlot.assignedElements();
      items.forEach((item, i) =>
        move(item, {
          fromX: `${(items.length - i) * -100}%`,
          toX: `${(items.length - i - 1) * -OVERLAP + 20}px`,
          timing: TIMING,
        }),
      );
    } else {
      this.button.removeAttribute("aria-pressed");

      fadeOut(this.items, { timing: TIMING });

      const elements = this.itemsSlot.assignedElements();
      Promise.all(
        elements.map((item, i) =>
          move(item, {
            fromX: `${(elements.length - i - 1) * -OVERLAP + 20}px`,
            toX: `${(elements.length - i) * -100}%`,
            timing: TIMING,
          }),
        ),
      ).then(() => this.items.classList.add("hidden"));
    }
  }

  private itemClicked(event: MouseEvent) {
    const target = event.target;
    if (!(target instanceof Element) || !target.hasAttribute("value")) {
      return;
    }

    this.value = target.getAttribute("value") ?? "";
    const changeEvent = new Event("change", { bubbles: true });
    this.dispatchEvent(changeEvent);
    this.toggle();
  }
}
