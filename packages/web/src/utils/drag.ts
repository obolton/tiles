import { PRIMARY_MOUSE_BUTTON } from "@/constants/input";
import { viewTransition } from "./transitions";

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
  | "dnd-dragover"
  | "dnd-drop";

interface DragDropEventInit<T> extends EventInit {
  state: DragState<T>;
  dragSource: HTMLElement;
  dropTarget?: HTMLElement;
  clientX?: number;
  clientY?: number;
}

export class DragDropEvent<T = never> extends Event {
  readonly state: DragState<T>;
  readonly dragSource: HTMLElement;
  readonly dropTarget?: HTMLElement;
  readonly clientX: number;
  readonly clientY: number;

  constructor(type: DragDropEventType, options: DragDropEventInit<T>) {
    const {
      state,
      dragSource,
      dropTarget,
      clientX = 0,
      clientY = 0,
      ...init
    } = options || {};
    super(type, init);

    this.state = state;
    this.dragSource = dragSource;
    this.dropTarget = dropTarget;
    this.clientX = clientX;
    this.clientY = clientY;
  }
}

export class DragState<T> {
  readonly element: HTMLElement;

  public data?: T;
  public destination?: HTMLElement | null;

  private readonly elementRect: DOMRect;
  private readonly fromPoint: DOMPoint;
  private readonly abortController = new AbortController();

  private isDragging = false;
  private dragElement?: HTMLElement;
  private dropTarget?: HTMLElement;
  private longPressTimeout?: ReturnType<typeof setTimeout>;
  private moveTimeout?: ReturnType<typeof setTimeout>;
  private scrollInterval?: ReturnType<typeof setInterval>;
  private scrollSpeed = 0;
  private pointerOffsetX = 0;
  private pointerOffsetY = 0;

  constructor(element: HTMLElement, fromPoint: DOMPoint) {
    this.element = element;
    this.elementRect = element.getBoundingClientRect();
    this.fromPoint = fromPoint;

    this.pointerOffsetX = this.fromPoint.x - this.elementRect.x;
    this.pointerOffsetY = this.fromPoint.y - this.elementRect.y;

    const signal = this.abortController.signal;

    addEventListener("pointerover", this, {
      passive: true,
      signal,
    });
    addEventListener("pointermove", this, {
      passive: true,
      signal,
    });
    addEventListener("pointerup", this, {
      passive: true,
      signal,
    });

    this.longPressTimeout = setTimeout(
      () => this.longPress(fromPoint.x, fromPoint.y),
      LONG_PRESS_DURATION,
    );
  }

  handleEvent(event: Event) {
    switch (event.type) {
      case "pointerover":
        return this.pointerOver(event as PointerEvent);
      case "pointermove":
        return this.pointerMove(event as PointerEvent);
      case "pointerup":
        return this.pointerUp(event as PointerEvent);
    }
  }

  private createDragDropEvent(
    type: DragDropEventType,
    options: Partial<DragDropEventInit<T>> = {},
  ) {
    return new DragDropEvent(type, {
      state: this,
      dragSource: this.element,
      dropTarget: this.dropTarget,
      ...options,
    });
  }

  private cancelLongPress() {
    clearTimeout(this.longPressTimeout);
  }

  private longPress(clientX: number, clientY: number) {
    this.startDrag(clientX, clientY);

    // Disable scrolling while dragging with touch
    addEventListener("touchmove", (event) => event.preventDefault(), {
      passive: false,
      signal: this.abortController.signal,
    });
  }

  private dragMove(event: PointerEvent) {
    const x = event.clientX - this.pointerOffsetX;
    const y = event.clientY - this.pointerOffsetY;
    this.dragElement?.style.setProperty("--translate-x", `${x}px`);
    this.dragElement?.style.setProperty("--translate-y", `${y}px`);

    clearTimeout(this.moveTimeout);

    this.moveTimeout = setTimeout(() => {
      this.element.dispatchEvent(
        this.createDragDropEvent("dnd-drag", {
          bubbles: true,
          cancelable: false,
          clientX: event.clientX,
          clientY: event.clientY,
        }),
      );

      this.dropTarget?.dispatchEvent(
        this.createDragDropEvent("dnd-dragover", {
          bubbles: true,
          cancelable: false,
          clientX: event.clientX,
          clientY: event.clientY,
        }),
      );
    }, MOVE_DEBOUNCE_INTERVAL);
  }

  private pointerOver(event: PointerEvent) {
    const { target } = event;

    if (!(target instanceof HTMLElement) || this.dropTarget === target) {
      return;
    }

    const preventDrop = target.dispatchEvent(
      this.createDragDropEvent("dnd-dragenter", {
        bubbles: true,
        cancelable: true,
        clientX: event.clientX,
        clientY: event.clientY,
      }),
    );

    this.dropTarget?.dispatchEvent(
      this.createDragDropEvent("dnd-dragleave", {
        bubbles: true,
        cancelable: false,
        clientX: event.clientX,
        clientY: event.clientY,
      }),
    );

    if (preventDrop) {
      this.dropTarget = undefined;
    } else {
      this.dropTarget = target;

      this.dropTarget.dispatchEvent(
        this.createDragDropEvent("dnd-dragover", {
          bubbles: true,
          cancelable: false,
          clientX: event.clientX,
          clientY: event.clientY,
        }),
      );
    }
  }

  private pointerMove(event: PointerEvent) {
    this.cancelLongPress();

    if (this.isDragging) {
      this.dragMove(event);
    } else if (event.pointerType !== "touch") {
      const deltaX = event.clientX - this.fromPoint.x;
      const deltaY = event.clientY - this.fromPoint.y;

      if (Math.hypot(deltaX, deltaY) >= DRAG_THRESHOLD) {
        this.startDrag(event.clientX, event.clientY);
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
    } else if (this.scrollInterval) {
      clearInterval(this.scrollInterval);
      this.scrollInterval = undefined;
      this.scrollSpeed = 0;
    }
  }

  private drop(event: PointerEvent) {
    this.dropTarget?.dispatchEvent(
      this.createDragDropEvent("dnd-drop", {
        bubbles: true,
        cancelable: false,
        clientX: event.clientX,
        clientY: event.clientY,
      }),
    );

    this.finish();
  }

  private finish() {
    this.cancelLongPress();

    this.abortController.abort();

    clearInterval(this.scrollInterval);
    this.scrollInterval = undefined;
    clearTimeout(this.moveTimeout);
    this.moveTimeout = undefined;

    if (this.isDragging) {
      this.dropTarget?.dispatchEvent(
        this.createDragDropEvent("dnd-dragleave", {
          bubbles: true,
          cancelable: false,
        }),
      );

      if (this.element.isConnected) {
        this.element.dispatchEvent(
          this.createDragDropEvent("dnd-dragend", {
            bubbles: true,
            cancelable: false,
          }),
        );
      } else {
        document.body.dispatchEvent(
          this.createDragDropEvent("dnd-dragend", {
            bubbles: true,
            cancelable: false,
          }),
        );
      }
    }

    delete document.body.dataset.drag;

    this.isDragging = false;
    this.dropTarget = undefined;

    // Animate the drag element to its final position
    if (this.dragElement) {
      if (this.destination) {
        this.dragElement.style.viewTransitionName = "drop";
      }

      viewTransition(() => {
        this.dragElement?.remove();
        this.dragElement = undefined;

        if (this.destination) {
          this.destination.style.viewTransitionName = "drop";
        }
      }).finished.finally(() => {
        if (this.destination) {
          this.destination.style.viewTransitionName = "";
          this.destination = undefined;
        }
      });
    }
  }

  private pointerUp(event: PointerEvent) {
    if (event.button !== PRIMARY_MOUSE_BUTTON) {
      return;
    }

    if (this.isDragging) {
      this.drop(event);
    } else {
      this.finish();
    }
  }

  private startDrag(clientX: number, clientY: number) {
    if (this.isDragging) {
      return;
    }

    const allowDrag = this.element.dispatchEvent(
      this.createDragDropEvent("dnd-dragstart", {
        bubbles: true,
        cancelable: true,
        clientX,
        clientY,
      }),
    );

    if (!allowDrag) {
      this.finish();
      return;
    }

    this.isDragging = true;
    document.body.dataset.drag = "true";

    this.dragElement = this.element.cloneNode(true) as HTMLElement;
    this.dragElement.id = "drag-preview";
    this.dragElement.dataset.dragPreview = "true";
    this.dragElement.popover = "manual";
    delete this.dragElement.dataset.animateLayoutId;

    const rotateX = (this.pointerOffsetX / this.elementRect.width - 0.5) * -2;
    const rotateY = (this.pointerOffsetY / this.elementRect.height - 0.5) * 2;
    const rotateAngle = 5 * Math.hypot(rotateX, rotateY);

    const style = this.dragElement.style;
    style.width = `${this.elementRect.width}px`;
    style.height = `${this.elementRect.height}px`;
    style.transformOrigin = `${this.pointerOffsetX}px ${this.pointerOffsetY}px`;
    style.setProperty("--translate-x", `${clientX - this.pointerOffsetX}px`);
    style.setProperty("--translate-y", `${clientY - this.pointerOffsetY}px`);
    style.setProperty("--rotate-x", `${rotateX}`);
    style.setProperty("--rotate-y", `${rotateY}`);
    style.setProperty("--rotate-angle", `${rotateAngle}deg`);

    document.body.appendChild(this.dragElement);
    this.dragElement.showPopover();
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
