import { getCenter, getDistance, getOffsetCenter } from "./geometry";

const DRAG_THRESHOLD = 10;
const PRIMARY_MOUSE_BUTTON = 0;
const LONG_PRESS_DURATION = 500;

export class DragState {
  readonly element: HTMLElement;

  private readonly container: Element;
  private readonly elementRect: DOMRect;
  private readonly fromPoint: DOMPoint;
  private readonly abortController = new AbortController();

  private isDragging = false;
  private dragElement: HTMLElement | null = null;
  private dropTarget: HTMLElement | null = null;
  private dropTargets: NodeListOf<HTMLElement> | null = null;
  private longPressTimeout: ReturnType<typeof setTimeout> | null = null;

  constructor(element: HTMLElement, fromPoint: DOMPoint) {
    this.element = element;
    this.container = element.offsetParent || document.body;
    this.elementRect = element.getBoundingClientRect();
    this.fromPoint = fromPoint;

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

          const target = this.findDropTarget();
          if (target !== this.dropTarget) {
            this.dropTarget = target;
            this.dropTarget?.dispatchEvent(
              new DragDropEvent("drag:drag-over", this.element),
            );
          }
        }
      });
    } else if (event.pointerType !== "touch") {
      if (Math.hypot(deltaX, deltaY) >= DRAG_THRESHOLD) {
        this.startDrag(deltaX, deltaY);
      }
    }
  }

  private pointerUp(event: PointerEvent) {
    if (event.button !== PRIMARY_MOUSE_BUTTON) {
      return;
    }

    this.cancelLongPress();

    // Remove all event listeners
    this.abortController.abort();

    if (!this.isDragging) {
      return;
    }

    this.isDragging = false;

    delete this.element.dataset.dragging;

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

    this.element.dispatchEvent(new DragDropEvent("drag:drop", this.element));

    this.dropTarget = null;
    this.dropTargets = null;
  }

  private startDrag(translateX: number = 0, translateY: number = 0) {
    if (this.isDragging) {
      return;
    }

    this.isDragging = true;

    this.dropTargets = document.querySelectorAll<HTMLElement>(
      '[data-drop-target="true"]',
    );

    this.dragElement = this.element.cloneNode(true) as HTMLElement;
    this.dragElement.dataset.dragPreview = "true";
    delete this.dragElement.dataset.dropTarget;

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
    document.body.style.setProperty("cursor", "move");

    this.element.dataset.dragging = "true";
  }

  private findDropTarget() {
    if (!this.dragElement || !this.dropTargets) {
      return null;
    }

    const dragCenter = getCenter(this.dragElement.getBoundingClientRect());
    const containerRect = this.container.getBoundingClientRect();

    // Find the drop target with the center closest to the drag element center

    let minDistance = Infinity;
    let targetIndex = -1;

    for (let i = 0; i < this.dropTargets.length; i++) {
      const targetCenter = getOffsetCenter(this.dropTargets[i]);
      targetCenter.x += containerRect.left;
      targetCenter.y += containerRect.top;

      const distance = getDistance(dragCenter, targetCenter);
      if (distance < minDistance) {
        targetIndex = i;
        minDistance = distance;
      }
    }

    // Look backwards for a target that can accommodate the drag element width

    if (targetIndex >= 0) {
      const dragWidth = this.element.clientWidth;
      const containerWidth = containerRect.width;

      while (targetIndex >= 0) {
        const target = this.dropTargets[targetIndex];
        const space = containerWidth - target.offsetLeft;
        if (space >= dragWidth) {
          return target;
        }
        targetIndex--;
      }
    }

    return null;
  }
}

export class DragDropEvent extends Event {
  constructor(
    type: string,
    readonly dragSource: HTMLElement,
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
