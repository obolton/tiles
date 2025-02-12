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
    this.tooltip.popover = "auto";

    addEventListener("pointerover", this, { passive: true });
    addEventListener("focusin", this, { passive: true });
  }

  handleEvent({ target, type }: Event) {
    switch (type) {
      case "pointerover":
      case "focusin":
        if (
          target instanceof HTMLElement &&
          target !== this.target &&
          target.dataset.tooltip
        ) {
          this.triggerShow(target);
        }
        break;

      case "pointerleave":
      case "blur":
        if (target === this.target) {
          this.triggerHide();
        }
        break;
    }
  }

  triggerShow(element: HTMLElement) {
    clearTimeout(this.activeTimeout);

    this.hide();
    this.target = element;

    if (this.active) {
      this.show();
    } else {
      this.activeTimeout = setTimeout(() => {
        this.active = true;
        this.show();
      }, TOOLTIP_DELAY);
    }
  }

  triggerHide() {
    clearTimeout(this.activeTimeout);

    this.hide();

    this.activeTimeout = setTimeout(() => {
      this.active = false;
    }, TOOLTIP_DELAY);
  }

  getPosition() {
    return (
      this.target
        ?.closest("[data-tooltip-position]")
        ?.getAttribute("data-tooltip-position") ?? "bottom"
    );
  }

  show() {
    if (!this.target || this.target.ariaExpanded === "true") {
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

    this.target.addEventListener("pointerleave", this, {
      passive: true,
    });
    this.target.addEventListener("blur", this, {
      passive: true,
    });
    this.target.setAttribute("aria-describedby", this.tooltip.id);
  }

  hide() {
    this.target?.removeEventListener("pointerleave", this);
    this.target?.removeEventListener("blur", this);
    this.target?.removeAttribute("aria-describedby");
    this.target = undefined;
    this.tooltip.hidePopover();
  }
}

const controller = new TooltipController();

export default controller;
