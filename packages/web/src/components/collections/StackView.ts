import css from "./StackView.css?inline";
import { willAnimateLayout, animateChildren } from "@/utils/animation/layout";

const stylesheet = new CSSStyleSheet();
stylesheet.replaceSync(css);

export default class StackView extends HTMLElement {
  private readonly internals: ElementInternals;
  private readonly container: HTMLElement;

  constructor() {
    super();

    this.handleClick = this.handleClick.bind(this);
    this.handleKeyDown = this.handleKeyDown.bind(this);

    const shadow = this.attachShadow({ mode: "closed", delegatesFocus: true });
    shadow.adoptedStyleSheets = [stylesheet];

    this.internals = this.attachInternals();

    this.container = document.createElement("div");
    this.container.id = "container";
    this.container.setAttribute("popover", "manual");
    this.container.setAttribute("tabindex", "0");

    const closeButton = document.createElement("button");
    closeButton.setAttribute("type", "button");
    closeButton.setAttribute("aria-label", "Close");
    closeButton.setAttribute("id", "close");
    closeButton.addEventListener("click", (event) => {
      event.stopPropagation();
      this.hide();
    });

    const items = document.createElement("section");
    items.id = "items";
    items.append(document.createElement("slot"));

    this.container.append(closeButton, items);

    shadow.append(this.container);

    this.addEventListener("click", this.handleClick);
  }

  get isExpanded() {
    return this.internals.states.has("expanded");
  }

  private handleClick(event: MouseEvent) {
    if (!this.isExpanded) {
      event.preventDefault();
      event.stopPropagation();
      this.show();
    } else if (event.target === this) {
      this.hide();
    }
  }

  private handleKeyDown(event: KeyboardEvent) {
    if (event.key === "Escape" && this.isExpanded) {
      event.preventDefault();
      event.stopPropagation();
      this.hide();
    }
  }

  show() {
    willAnimateLayout(this);
    document.body.style.setProperty("overflow", "hidden");
    this.internals.states.add("expanded");
    this.internals.states.add("overlay");
    this.container.showPopover();
    this.container.scrollTo({ top: 0, behavior: "instant" });
    animateChildren(this);
    this.addEventListener("keydown", this.handleKeyDown);
    this.dispatchEvent(
      new ToggleEvent("toggle", { oldState: "closed", newState: "open" }),
    );
  }

  hide() {
    willAnimateLayout(this);
    document.body.style.removeProperty("overflow");
    this.internals.states.delete("expanded");
    this.container.hidePopover();
    animateChildren(this).then(() => this.internals.states.delete("overlay"));
    this.removeEventListener("keydown", this.handleKeyDown);
    this.dispatchEvent(
      new ToggleEvent("toggle", { oldState: "open", newState: "closed" }),
    );
  }
}
