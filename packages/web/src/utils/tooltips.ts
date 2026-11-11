const TOOLTIP_DELAY = 500;
const TOOLTIP_MARGIN = 16;

const TOOLTIP_POSITIONS = ["top", "bottom", "left", "right"] as const;

type TooltipPosition = (typeof TOOLTIP_POSITIONS)[number];

const OPPOSITE_POSITIONS: Record<TooltipPosition, TooltipPosition> = {
  top: "bottom",
  bottom: "top",
  left: "right",
  right: "left",
};

const TRANSFORM_ORIGINS: Record<TooltipPosition, string> = {
  top: "center bottom",
  bottom: "center top",
  left: "right center",
  right: "left center",
};

/**
 * Whether the tooltip can be anchored to its target with `showPopover({ source })` and positioned
 * with CSS. Browsers that expose a toggle's `source` also accept it as a `showPopover()` option.
 */
function supportsAnchoredPopovers() {
  return CSS.supports("position-area", "bottom") && "source" in ToggleEvent.prototype;
}

function isTooltipPosition(value: unknown): value is TooltipPosition {
  return TOOLTIP_POSITIONS.some((position) => position === value);
}

/** Keeps a box of the given size within the viewport, with a margin on each side. */
function clamp(start: number, size: number, viewportSize: number) {
  return Math.max(TOOLTIP_MARGIN, Math.min(start, viewportSize - size - TOOLTIP_MARGIN));
}

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
          // Focus only counts when it is visible, so focus moved by script after a click
          // (e.g. into a newly opened panel) does not show a tooltip
          if (event.type === "focusin" && !event.target.matches(":focus-visible")) {
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

  private getPosition(): TooltipPosition {
    const position = this.target
      ?.closest("[data-tooltip-position]")
      ?.getAttribute("data-tooltip-position");
    return isTooltipPosition(position) ? position : "bottom";
  }

  private show() {
    if (!this.target) {
      return;
    }

    if (!this.tooltip.isConnected) {
      document.body.appendChild(this.tooltip);
    }

    const position = this.getPosition();
    this.tooltip.textContent = this.target.dataset.tooltip ?? "";

    if (supportsAnchoredPopovers()) {
      // CSS anchor positioning flips and shifts the tooltip to keep it within the viewport
      this.tooltip.dataset.position = position;
      this.tooltip.showPopover({ source: this.target });
    } else {
      this.tooltip.showPopover();
      this.setPosition(this.target, position);
    }

    this.target.setAttribute("aria-describedby", this.tooltip.id);
  }

  private setPosition(target: HTMLElement, preferred: TooltipPosition) {
    const width = this.tooltip.offsetWidth;
    const height = this.tooltip.offsetHeight;
    const bounds = target.getBoundingClientRect();
    const viewportWidth = document.documentElement.clientWidth;
    const viewportHeight = document.documentElement.clientHeight;

    const fits: Record<TooltipPosition, boolean> = {
      top: bounds.top - height - TOOLTIP_MARGIN * 2 >= 0,
      bottom: bounds.bottom + height + TOOLTIP_MARGIN * 2 <= viewportHeight,
      left: bounds.left - width - TOOLTIP_MARGIN * 2 >= 0,
      right: bounds.right + width + TOOLTIP_MARGIN * 2 <= viewportWidth,
    };
    const position =
      [preferred, OPPOSITE_POSITIONS[preferred], "bottom" as const, "top" as const].find(
        (candidate) => fits[candidate],
      ) ?? preferred;

    let top = bounds.top + (bounds.height - height) / 2;
    let left = bounds.left + (bounds.width - width) / 2;

    switch (position) {
      case "top":
        top = bounds.top - height - TOOLTIP_MARGIN;
        break;
      case "bottom":
        top = bounds.bottom + TOOLTIP_MARGIN;
        break;
      case "left":
        left = bounds.left - width - TOOLTIP_MARGIN;
        break;
      case "right":
        left = bounds.right + TOOLTIP_MARGIN;
        break;
    }

    this.tooltip.style.top = `${clamp(top, height, viewportHeight)}px`;
    this.tooltip.style.left = `${clamp(left, width, viewportWidth)}px`;
    this.tooltip.style.transformOrigin = TRANSFORM_ORIGINS[position];
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
