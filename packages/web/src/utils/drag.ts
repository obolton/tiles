import { getCenter } from "./geometry";
import { PRIMARY_MOUSE_BUTTON } from "@/constants/input";
import { SPRING } from "./animation/effects";

const DRAG_THRESHOLD = 10; // px
const SCROLL_MARGIN = 50; // px from viewport edge
const SCROLL_INTERVAL = 16; // ms
const MOVE_DEBOUNCE_INTERVAL = 100; // ms
const MAX_SCROLL_SPEED = 20; // px per scroll
const LONG_PRESS_DURATION = 500; // ms

type DragDropEventType =
  | "dnd-dragstart"
  | "dnd-dragend"
  | "dnd-dragenter"
  | "dnd-dragleave"
  | "dnd-drag"
  | "dnd-drop";

interface DragDropEventInit extends EventInit {
  state: DragState;
  dragSource: HTMLElement;
  dropTarget?: HTMLElement;
  clientX?: number;
  clientY?: number;
  hitX: number;
  hitY: number;
}

export class DragDropEvent extends Event {
  readonly state: DragState;
  readonly dragSource: HTMLElement;
  readonly dropTarget?: HTMLElement;
  readonly clientX?: number;
  readonly clientY?: number;
  readonly hitX: number;
  readonly hitY: number;

  constructor(type: DragDropEventType, options: DragDropEventInit) {
    const {
      state,
      dragSource,
      dropTarget,
      clientX,
      clientY,
      hitX,
      hitY,
      ...init
    } = options || {};
    super(type, init);

    this.state = state;
    this.dragSource = dragSource;
    this.dropTarget = dropTarget;
    this.clientX = clientX;
    this.clientY = clientY;
    this.hitX = hitX;
    this.hitY = hitY;
  }
}

export class DragState {
  readonly element: HTMLElement;

  public data: object = {};

  private readonly container: Element;
  private readonly elementRect: DOMRect;
  private readonly fromPoint: DOMPoint;
  private readonly abortController = new AbortController();

  private isDragging = false;
  private dropGroup: string;
  private dragElement?: HTMLElement;
  private dropTarget?: HTMLElement;
  private longPressTimeout: ReturnType<typeof setTimeout> | null = null;
  private moveTimeout: ReturnType<typeof setTimeout> | null = null;
  private scrollInterval: ReturnType<typeof setInterval> | null = null;
  private scrollSpeed = 0;
  private centerOffsetX = 0;
  private centerOffsetY = 0;
  private hitX = 0;
  private hitY = 0;

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

  private createDragDropEvent(
    type: DragDropEventType,
    options: Partial<DragDropEventInit> = {},
  ) {
    return new DragDropEvent(type, {
      state: this,
      dragSource: this.element,
      dropTarget: this.dropTarget,
      hitX: this.hitX,
      hitY: this.hitY,
      ...options,
    });
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
    addEventListener("touchmove", (event) => event.preventDefault(), {
      passive: false,
      signal: this.abortController.signal,
    });
  }

  private dragMove(event: PointerEvent) {
    requestAnimationFrame(() => {
      const deltaX = event.clientX - this.fromPoint.x;
      const deltaY = event.clientY - this.fromPoint.y;
      this.dragElement?.style.setProperty("--translate-x", `${deltaX}px`);
      this.dragElement?.style.setProperty("--translate-y", `${deltaY}px`);
    });

    if (this.moveTimeout !== null) {
      clearTimeout(this.moveTimeout);
    }

    this.moveTimeout = setTimeout(() => {
      this.element.dispatchEvent(
        this.createDragDropEvent("dnd-drag", {
          bubbles: true,
          cancelable: false,
          clientX: event.clientX,
          clientY: event.clientY,
        }),
      );

      this.hitX = event.clientX - this.centerOffsetX;
      this.hitY = event.clientY - this.centerOffsetY;
      const target = this.findDropTarget(event.clientX, event.clientY);

      if (this.dropTarget && this.dropTarget !== target) {
        this.dropTarget.dispatchEvent(
          this.createDragDropEvent("dnd-dragleave", {
            bubbles: true,
            cancelable: false,
            clientX: event.clientX,
            clientY: event.clientY,
          }),
        );
      }

      const allowDrop =
        target?.dispatchEvent(
          this.createDragDropEvent("dnd-dragenter", {
            bubbles: true,
            cancelable: true,
            clientX: event.clientX,
            clientY: event.clientY,
          }),
        ) ?? false;

      this.dropTarget = allowDrop ? target : undefined;

      this.moveTimeout = null;
    }, MOVE_DEBOUNCE_INTERVAL);
  }

  private pointerMove(event: PointerEvent) {
    this.cancelLongPress();

    if (this.isDragging) {
      this.dragMove(event);
    } else if (event.pointerType !== "touch") {
      const deltaX = event.clientX - this.fromPoint.x;
      const deltaY = event.clientY - this.fromPoint.y;

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

  private cancel() {
    this.cancelLongPress();

    this.abortController.abort();

    if (this.scrollInterval) {
      clearInterval(this.scrollInterval);
      this.scrollInterval = null;
    }

    if (this.moveTimeout) {
      clearTimeout(this.moveTimeout);
      this.moveTimeout = null;
    }

    if (this.isDragging) {
      this.dropTarget?.dispatchEvent(
        this.createDragDropEvent("dnd-dragleave", {
          bubbles: true,
          cancelable: false,
        }),
      );

      this.element.dispatchEvent(
        this.createDragDropEvent("dnd-dragend", {
          bubbles: true,
          cancelable: false,
        }),
      );
    }

    this.isDragging = false;
    this.dropTarget = undefined;
  }

  private pointerUp(event: PointerEvent) {
    if (event.button !== PRIMARY_MOUSE_BUTTON) {
      return;
    }

    if (!this.isDragging) {
      this.cancel();
      return;
    }

    delete document.body.dataset.drag;
    delete this.element.dataset.dragging;

    // Animate the drag element to its final position
    if (this.dragElement) {
      const containerRect = this.container.getBoundingClientRect();
      const deltaX =
        containerRect.left + this.element.offsetLeft - this.elementRect.left;
      const deltaY =
        containerRect.top + this.element.offsetTop - this.elementRect.top;
      const animation = this.dragElement.animate(
        [
          {
            translate: `${deltaX}px ${deltaY}px`,
            boxShadow: "inherit",
          },
        ],
        SPRING,
      );
      animation.finished.then(() => {
        this.dragElement?.remove();
        this.dragElement = undefined;
      });
    }

    this.dropTarget?.dispatchEvent(
      this.createDragDropEvent("dnd-drop", {
        bubbles: true,
        cancelable: false,
      }),
    );

    this.cancel();
  }

  private startDrag(translateX: number = 0, translateY: number = 0) {
    if (this.isDragging) {
      return;
    }

    const allowDrag = this.element.dispatchEvent(
      this.createDragDropEvent("dnd-dragstart", {
        bubbles: true,
        cancelable: true,
      }),
    );

    if (!allowDrag) {
      this.cancel();
      return;
    }

    this.isDragging = true;
    document.body.dataset.drag = "true";

    this.dragElement = this.element.cloneNode(true) as HTMLElement;
    this.dragElement.dataset.dragPreview = "true";
    delete this.dragElement.dataset.dropTarget;
    this.dragElement.popover = "manual";

    const offsetX = this.fromPoint.x - this.elementRect.left;
    const offsetY = this.fromPoint.y - this.elementRect.top;
    const rotateX = (offsetX / this.elementRect.width - 0.5) * -2;
    const rotateY = (offsetY / this.elementRect.height - 0.5) * 2;
    const rotateAngle = 5 * Math.hypot(rotateX, rotateY);

    const dragElementStyle = this.dragElement.style;
    dragElementStyle.setProperty("width", `${this.elementRect.width}px`);
    dragElementStyle.setProperty("height", `${this.elementRect.height}px`);
    dragElementStyle.setProperty("--initial-x", `${this.elementRect.left}px`);
    dragElementStyle.setProperty("--initial-y", `${this.elementRect.top}px`);
    dragElementStyle.setProperty("--translate-x", `${translateX}px`);
    dragElementStyle.setProperty("--translate-y", `${translateY}px`);
    dragElementStyle.setProperty(
      "--transform-origin",
      `${offsetX}px ${offsetY}px`,
    );
    dragElementStyle.setProperty("--rotate-x", `${rotateX}`);
    dragElementStyle.setProperty("--rotate-y", `${rotateY}`);
    dragElementStyle.setProperty("--rotate-angle", `${rotateAngle}deg`);

    document.body.appendChild(this.dragElement);
    this.dragElement.showPopover();

    this.element.dataset.dragging = "true";
  }

  private findDropTarget(x: number, y: number) {
    return document
      .elementsFromPoint(x, y)
      .find(
        (element): element is HTMLElement =>
          element instanceof HTMLElement &&
          element.dataset.dropGroup === this.dropGroup &&
          element !== this.element,
      );
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
  const abortController = new AbortController();
  element.addEventListener("pointerdown", pointerDown, {
    passive: false,
    signal: abortController.signal,
  });
  element.addEventListener("contextmenu", contextMenu, {
    passive: false,
    signal: abortController.signal,
  });
  element.dataset.draggable = "true";

  return () => {
    abortController.abort();
    delete element.dataset.draggable;
  };
}
