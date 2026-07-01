const TOOLTIP_DELAY = 500;
const TOOLTIP_MARGIN = 16;

class TooltipController {
  private active = false;
  private tooltip: HTMLDivElement;
  private target?: HTMLElement;
  private activeTimeout?: ReturnType<typeof setTimeout>;

  constructor() {
    this.tooltip = document.createElement("div");
    this.tooltip.id = "tooltip";
    this.tooltip.role = "tooltip";
    this.tooltip.ariaLive = "polite";
    this.tooltip.popover = "manual";

    addEventListener("pointerover", this, { passive: true });
    addEventListener("focusin", this, { passive: true });
  }

  handleEvent(event: Event) {
    switch (event.type) {
      case "pointerover":
      case "focusin":
        {
          if (!(event.target instanceof Element)) {
            return;
          }
          const target = event.target.closest<HTMLElement>("[data-tooltip]");
          if (target && target !== this.target && target.ariaExpanded !== "true") {
            this.enter(target);
          }
        }
        break;

      case "pointerleave":
      case "blur":
      case "click":
        return this.close();

      case "keydown":
        return this.handleKeyDown(event as KeyboardEvent);
    }
  }

  private handleKeyDown(event: KeyboardEvent) {
    if (event.key === "Escape") {
      this.close();
    }
  }

  private enter(element: HTMLElement) {
    clearTimeout(this.activeTimeout);

    this.resetTarget();
    this.target = element;

    if (this.active) {
      this.show();
    } else {
      this.activeTimeout = setTimeout(() => {
        this.active = true;
        this.show();
      }, TOOLTIP_DELAY);
    }

    element.addEventListener("pointerleave", this, {
      passive: true,
    });
    element.addEventListener("blur", this, {
      passive: true,
    });
    addEventListener("click", this, { passive: true });
    addEventListener("keydown", this, { passive: true });
  }

  private close() {
    this.resetTarget();
    this.tooltip.hidePopover();

    clearTimeout(this.activeTimeout);
    this.activeTimeout = setTimeout(() => {
      this.active = false;
    }, TOOLTIP_DELAY);
  }

  private getPosition() {
    return (
      this.target?.closest("[data-tooltip-position]")?.getAttribute("data-tooltip-position") ??
      "bottom"
    );
  }

  private show() {
    if (!this.target) {
      return;
    }

    if (!this.tooltip.isConnected) {
      document.body.appendChild(this.tooltip);
    }

    this.tooltip.textContent = this.target.dataset.tooltip ?? "";
    this.tooltip.showPopover();
    const width = this.tooltip.offsetWidth;
    const height = this.tooltip.offsetHeight;

    const bounds = this.target.getBoundingClientRect();
    const position = this.getPosition();

    switch (position) {
      case "left":
        this.tooltip.style.top = `${bounds.top + (bounds.height - height) / 2}px`;
        this.tooltip.style.left = `${bounds.left - width - TOOLTIP_MARGIN}px`;
        this.tooltip.style.transformOrigin = "right center";
        break;
      case "right":
        this.tooltip.style.top = `${bounds.top + (bounds.height - height) / 2}px`;
        this.tooltip.style.left = `${bounds.right + TOOLTIP_MARGIN}px`;
        this.tooltip.style.transformOrigin = "left center";
        break;
      case "top":
        this.tooltip.style.top = `${bounds.top - height - TOOLTIP_MARGIN}px`;
        this.tooltip.style.left = `${bounds.left + (bounds.width - width) / 2}px`;
        this.tooltip.style.transformOrigin = "center bottom";
        break;
      case "bottom":
        this.tooltip.style.top = `${bounds.bottom + TOOLTIP_MARGIN}px`;
        this.tooltip.style.left = `${bounds.left + (bounds.width - width) / 2}px`;
        this.tooltip.style.transformOrigin = "center top";
        break;
      default:
        throw new Error(`Invalid tooltip position: ${position}`);
    }

    this.target.setAttribute("aria-describedby", this.tooltip.id);
  }

  private resetTarget() {
    this.target?.removeAttribute("aria-describedby");
    this.target?.removeEventListener("pointerleave", this);
    this.target?.removeEventListener("blur", this);
    this.target = undefined;
    removeEventListener("click", this);
    removeEventListener("keydown", this);
  }
}

const controller = new TooltipController();

export default controller;
