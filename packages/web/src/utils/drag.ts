import { getCenter, getDistance, getOffsetCenter } from "./geometry";

const DRAG_THRESHOLD = 10; // px
const SCROLL_MARGIN = 50; // px from viewport edge
const SCROLL_INTERVAL = 16; // ms
const MOVE_DEBOUNCE_INTERVAL = 100; // ms
const MAX_SCROLL_SPEED = 20; // px per scroll
const PRIMARY_MOUSE_BUTTON = 0;
const LONG_PRESS_DURATION = 500; // ms

export class DragState {
  readonly element: HTMLElement;

  private readonly container: Element;
  private readonly elementRect: DOMRect;
  private readonly fromPoint: DOMPoint;
  private readonly abortController = new AbortController();

  private isDragging = false;
  private dropGroup: string;
  private dragElement: HTMLElement | null = null;
  private dropTarget: HTMLElement | null = null;
  private dropTargets: NodeListOf<HTMLElement> | null = null;
  private longPressTimeout: ReturnType<typeof setTimeout> | null = null;
  private moveTimeout: ReturnType<typeof setTimeout> | null = null;
  private scrollInterval: ReturnType<typeof setInterval> | null = null;
  private scrollSpeed = 0;
  private centerOffsetX = 0;
  private centerOffsetY = 0;

  constructor(element: HTMLElement, fromPoint: DOMPoint) {
    this.element = element;
    this.dropGroup = element.dataset.dropGroup || "root";
    this.container = element.offsetParent || document.body;
    this.elementRect = element.getBoundingClientRect();
    this.fromPoint = fromPoint;

    const center = getCenter(this.elementRect);
    this.centerOffsetX = this.fromPoint.x - center.x;
    this.centerOffsetY = this.fromPoint.y - center.y;

    const signal = this.abortController.signal;

    addEventListener("pointermove", this.pointerMove.bind(this), {
      passive: true,
      signal,
    });
    addEventListener("pointerup", this.pointerUp.bind(this), {
      passive: true,
      signal,
    });

    this.longPressTimeout = setTimeout(
      this.longPress.bind(this),
      LONG_PRESS_DURATION,
    );
  }

  private cancelLongPress() {
    if (this.longPressTimeout !== null) {
      clearTimeout(this.longPressTimeout);
      this.longPressTimeout = null;
    }
  }

  private longPress() {
    this.longPressTimeout = null;

    this.startDrag();

    // Disable scrolling while dragging with touch
    addEventListener("touchmove", this.touchMove.bind(this), {
      passive: false,
      signal: this.abortController.signal,
    });
  }

  private touchMove(event: TouchEvent) {
    event.preventDefault();
  }

  private pointerMove(event: PointerEvent) {
    this.cancelLongPress();

    const deltaX = event.clientX - this.fromPoint.x;
    const deltaY = event.clientY - this.fromPoint.y;

    if (this.isDragging) {
      requestAnimationFrame(() => {
        if (this.dragElement) {
          this.dragElement.style.setProperty("--translate-x", `${deltaX}px`);
          this.dragElement.style.setProperty("--translate-y", `${deltaY}px`);
        }

        if (this.moveTimeout !== null) {
          clearTimeout(this.moveTimeout);
        }
        this.moveTimeout = setTimeout(() => {
          const { target, inside } = this.findDropTarget(
            new DOMPoint(
              event.clientX - this.centerOffsetX,
              event.clientY - this.centerOffsetY,
            ),
          );

          if (this.dropTarget && this.dropTarget !== target) {
            delete this.dropTarget.dataset.dragOver;
          }

          if (inside && target && target !== this.element) {
            target.dataset.dragOver = "true";
            this.dropTarget = target;
          } else {
            this.dropTarget = null;
          }

          target?.dispatchEvent(
            new DragDropEvent("drag:drag-over", this.element, inside),
          );
          this.moveTimeout = null;
        }, MOVE_DEBOUNCE_INTERVAL);
      });
    } else if (event.pointerType !== "touch") {
      if (Math.hypot(deltaX, deltaY) >= DRAG_THRESHOLD) {
        this.startDrag(deltaX, deltaY);
      }
    }

    if (event.clientY <= SCROLL_MARGIN) {
      this.scrollSpeed = -(SCROLL_MARGIN - event.clientY);
      this.scrollInterval ??= setInterval(
        this.scroll.bind(this),
        SCROLL_INTERVAL,
      );
    } else if (window.innerHeight - event.clientY <= SCROLL_MARGIN) {
      this.scrollSpeed = SCROLL_MARGIN - (window.innerHeight - event.clientY);
      this.scrollInterval ??= setInterval(
        this.scroll.bind(this),
        SCROLL_INTERVAL,
      );
    } else if (this.scrollInterval !== null) {
      clearInterval(this.scrollInterval);
      this.scrollInterval = null;
      this.scrollSpeed = 0;
    }
  }

  private pointerUp(event: PointerEvent) {
    if (event.button !== PRIMARY_MOUSE_BUTTON) {
      return;
    }

    this.cancelLongPress();

    // Remove all event listeners
    this.abortController.abort();

    if (this.scrollInterval !== null) {
      clearInterval(this.scrollInterval);
      this.scrollInterval = null;
    }

    if (this.moveTimeout !== null) {
      clearTimeout(this.moveTimeout);
      this.moveTimeout = null;
    }

    if (!this.isDragging) {
      return;
    }

    this.isDragging = false;

    delete document.body.dataset.drag;
    delete this.element.dataset.dragging;
    if (this.dropTarget) {
      delete this.dropTarget.dataset.dragOver;
    }

    // Animate the drag element image to its final position
    if (this.dragElement) {
      const containerRect = this.container.getBoundingClientRect();
      const deltaX =
        containerRect.left + this.element.offsetLeft - this.elementRect.left;
      const deltaY =
        containerRect.top + this.element.offsetTop - this.elementRect.top;
      const animation = this.dragElement.animate(
        [
          {
            transform: `translate(${deltaX}px, ${deltaY}px)`,
            boxShadow: "inherit",
          },
        ],
        {
          duration: 200,
          easing: "ease",
        },
      );
      animation.addEventListener(
        "finish",
        () => {
          this.dragElement?.remove();
          this.dragElement = null;
        },
        { once: true },
      );
    }

    document.body.style.removeProperty("cursor");

    this.element.dispatchEvent(
      new DragDropEvent("drag:drop", this.element, !!this.dropTarget),
    );
    this.dropTarget?.dispatchEvent(
      new DragDropEvent("drag:drop-on", this.element),
    );

    this.dropTarget = null;
    this.dropTargets = null;
  }

  private startDrag(translateX: number = 0, translateY: number = 0) {
    if (this.isDragging) {
      return;
    }

    this.isDragging = true;
    document.body.dataset.drag = "true";

    this.dropTargets = document.querySelectorAll<HTMLElement>(
      `[data-drop-group="${this.dropGroup}"]`,
    );

    this.dragElement = this.element.cloneNode(true) as HTMLElement;
    this.dragElement.dataset.dragPreview = "true";
    delete this.dragElement.dataset.dropTarget;
    this.dragElement.setAttribute("popover", "manual");

    this.dragElement.style.setProperty("width", `${this.elementRect.width}px`);
    this.dragElement.style.setProperty(
      "height",
      `${this.elementRect.height}px`,
    );
    this.dragElement.style.setProperty(
      "--initial-x",
      `${this.elementRect.left}px`,
    );
    this.dragElement.style.setProperty(
      "--initial-y",
      `${this.elementRect.top}px`,
    );
    this.dragElement.style.setProperty("--translate-x", `${translateX}px`);
    this.dragElement.style.setProperty("--translate-y", `${translateY}px`);

    const offsetX = this.fromPoint.x - this.elementRect.left;
    const offsetY = this.fromPoint.y - this.elementRect.top;
    const rotateX = (offsetX / this.elementRect.width - 0.5) * -2;
    const rotateY = (offsetY / this.elementRect.height - 0.5) * 2;
    const rotateAngle = 5 * Math.hypot(rotateX, rotateY);

    this.dragElement.style.setProperty("--transform-origin-x", `${offsetX}px`);
    this.dragElement.style.setProperty("--transform-origin-y", `${offsetY}px`);
    this.dragElement.style.setProperty("--rotate-x", `${rotateX}`);
    this.dragElement.style.setProperty("--rotate-y", `${rotateY}`);
    this.dragElement.style.setProperty("--rotate-angle", `${rotateAngle}deg`);

    document.body.appendChild(this.dragElement);
    this.dragElement.showPopover();

    document.body.style.setProperty("cursor", "move");

    this.element.dataset.dragging = "true";
  }

  private findDropTarget(point: DOMPoint) {
    if (!this.dragElement || !this.dropTargets) {
      return { target: null, inside: false };
    }

    const containerRect = this.container.getBoundingClientRect();

    // Find the drop target with the center closest to the drag element center

    let minDistance = Infinity;
    let targetIndex = -1;

    for (let i = 0; i < this.dropTargets.length; i++) {
      const target = this.dropTargets[i];
      if (!target) {
        continue;
      }
      const targetCenter = getOffsetCenter(target);
      targetCenter.x += containerRect.left;
      targetCenter.y += containerRect.top;

      const distance = getDistance(point, targetCenter);
      if (distance < minDistance) {
        targetIndex = i;
        minDistance = distance;
      }
    }

    if (minDistance < 80) {
      return { target: this.dropTargets[targetIndex], inside: true };
    }

    // Look backwards for a target that can accommodate the drag element width

    if (targetIndex >= 0) {
      const dragWidth = this.element.clientWidth;
      const containerWidth = containerRect.width;

      while (targetIndex >= 0) {
        const target = this.dropTargets[targetIndex];
        if (target) {
          const space = containerWidth - target.offsetLeft;
          if (space >= dragWidth) {
            return { target, inside: false };
          }
        }
        targetIndex--;
      }
    }

    return { target: null, inside: false };
  }

  private scroll() {
    if (this.scrollSpeed === 0) {
      return;
    }
    window.scrollBy({
      top: (this.scrollSpeed / SCROLL_MARGIN) * MAX_SCROLL_SPEED,
      behavior: "instant",
    });
  }
}

export class DragDropEvent extends Event {
  constructor(
    type: "drag:drag-over" | "drag:drop" | "drag:drop-on",
    readonly dragSource: HTMLElement,
    readonly inside: boolean = false,
  ) {
    super(type, { bubbles: true, cancelable: false });
  }
}

function pointerDown(event: PointerEvent) {
  if (
    event.button !== PRIMARY_MOUSE_BUTTON ||
    !(event.currentTarget instanceof HTMLElement)
  ) {
    return;
  }

  event.preventDefault();
  event.stopPropagation();

  new DragState(
    event.currentTarget,
    new DOMPoint(event.clientX, event.clientY),
  );
}

function contextMenu(event: PointerEvent | MouseEvent) {
  if (event instanceof PointerEvent && event.pointerType === "touch") {
    event.preventDefault();
  }
}

export function makeDraggable(element: HTMLElement) {
  element.addEventListener("pointerdown", pointerDown, { passive: false });
  element.addEventListener("contextmenu", contextMenu, { passive: false });
  element.dataset.draggable = "true";

  return () => {
    element.removeEventListener("pointerdown", pointerDown);
    element.removeEventListener("contextmenu", contextMenu);
    delete element.dataset.draggable;
  };
}
