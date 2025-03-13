import { PRIMARY_MOUSE_BUTTON } from "@/constants/input";
import { viewTransition } from "./transitions";

const DRAG_THRESHOLD = 10; // px
const SCROLL_MARGIN = 50; // px from viewport edge
const SCROLL_INTERVAL = 16; // ms
const DRAG_EVENT_INTERVAL = 300; // ms
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

  data?: T;
  destination?: HTMLElement | null;

  private readonly startX: number;
  private readonly startY: number;
  private readonly originX: number;
  private readonly originY: number;
  private readonly abortController = new AbortController();

  private isDragging = false;
  private dragElement?: HTMLElement;
  private dropTarget?: HTMLElement;
  private longPressTimeout?: ReturnType<typeof setTimeout>;
  private dragInterval?: ReturnType<typeof setInterval>;
  private scrollInterval?: ReturnType<typeof setInterval>;
  private scrollSpeed = 0;
  private pendingDragEvent: { x: number; y: number } | null = null;

  constructor(element: HTMLElement, startX: number, startY: number) {
    this.element = element;
    this.startX = startX;
    this.startY = startY;

    const rect = element.getBoundingClientRect();
    this.originX = startX - rect.x;
    this.originY = startY - rect.y;

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
    addEventListener("keydown", this, {
      passive: false,
      signal,
    });

    this.longPressTimeout = setTimeout(
      () => this.longPress(),
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
      case "keydown":
        return this.keyDown(event as KeyboardEvent);
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

  // Long press

  private longPress() {
    this.startDrag(this.startX, this.startY);

    // Disable scrolling while dragging with touch
    addEventListener("touchmove", (event) => event.preventDefault(), {
      passive: false,
      signal: this.abortController.signal,
    });
  }

  private cancelLongPress() {
    clearTimeout(this.longPressTimeout);
  }

  // Pointer events

  private pointerOver(event: PointerEvent) {
    if (!(event.target instanceof HTMLElement)) {
      return;
    }

    const target = event.target.closest<HTMLElement>('[data-drop="true"]');
    if (!target || target === this.dropTarget) {
      return;
    }

    const allowDrop = target.dispatchEvent(
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

    if (allowDrop) {
      this.dropTarget = target;
      this.scheduleDragEvent(event.clientX, event.clientY);
    } else {
      this.dropTarget = undefined;
    }
  }

  private pointerMove(event: PointerEvent) {
    this.cancelLongPress();

    if (this.isDragging) {
      this.scheduleDragEvent(event.clientX, event.clientY);

      requestAnimationFrame(() => {
        const x = event.clientX - this.originX;
        const y = event.clientY - this.originY;
        this.dragElement?.style.setProperty("--translate-x", `${x}px`);
        this.dragElement?.style.setProperty("--translate-y", `${y}px`);
      });
    } else if (event.pointerType !== "touch") {
      const deltaX = event.clientX - this.startX;
      const deltaY = event.clientY - this.startY;

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
    } else if (typeof this.scrollInterval !== "undefined") {
      clearInterval(this.scrollInterval);
      this.scrollInterval = undefined;
      this.scrollSpeed = 0;
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

  // Keyboard events

  private keyDown(event: KeyboardEvent) {
    if (event.key === "Escape") {
      event.preventDefault();
      this.finish();
    }
  }

  // Drag lifecycle

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
    this.dragElement.popover = "manual";
    delete this.dragElement.dataset.animateLayoutId;

    const rect = this.element.getBoundingClientRect();

    const rotateX = (this.originX / rect.width - 0.5) * -2;
    const rotateY = (this.originY / rect.height - 0.5) * 2;
    const rotateAngle = 5 * Math.hypot(rotateX, rotateY);

    const style = this.dragElement.style;
    style.width = `${rect.width}px`;
    style.height = `${rect.height}px`;
    style.transformOrigin = `${this.originX}px ${this.originY}px`;
    style.setProperty("--translate-x", `${clientX - this.originX}px`);
    style.setProperty("--translate-y", `${clientY - this.originY}px`);
    style.setProperty("--rotate-x", `${rotateX}`);
    style.setProperty("--rotate-y", `${rotateY}`);
    style.setProperty("--rotate-angle", `${rotateAngle}deg`);

    document.body.appendChild(this.dragElement);
    this.dragElement.showPopover();

    this.dragInterval = setInterval(
      this.processPendingDragEvent.bind(this),
      DRAG_EVENT_INTERVAL,
    );
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
    this.abortController.abort();

    this.cancelLongPress();
    clearInterval(this.scrollInterval);
    clearInterval(this.dragInterval);

    if (this.isDragging) {
      this.dropTarget?.dispatchEvent(
        this.createDragDropEvent("dnd-dragleave", {
          bubbles: true,
          cancelable: false,
        }),
      );

      const dragEndTarget = this.element.isConnected
        ? this.element
        : document.body;

      dragEndTarget.dispatchEvent(
        this.createDragDropEvent("dnd-dragend", {
          bubbles: true,
          cancelable: false,
        }),
      );
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

  private scheduleDragEvent(x: number, y: number) {
    this.pendingDragEvent = { x, y };
  }

  private processPendingDragEvent() {
    if (!this.pendingDragEvent) {
      return;
    }

    const { x, y } = this.pendingDragEvent;

    this.element.dispatchEvent(
      this.createDragDropEvent("dnd-drag", {
        bubbles: true,
        cancelable: false,
        clientX: x,
        clientY: y,
      }),
    );

    this.dropTarget?.dispatchEvent(
      this.createDragDropEvent("dnd-dragover", {
        bubbles: true,
        cancelable: false,
        clientX: x,
        clientY: y,
      }),
    );

    this.pendingDragEvent = null;
  }

  // Scrolling

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

function cancelContextMenu(event: PointerEvent | MouseEvent) {
  if (event instanceof PointerEvent && event.pointerType === "touch") {
    event.preventDefault();
  }
}

export interface DragOptions {
  handle?: HTMLElement;
  signal?: AbortSignal;
}

export function makeDraggable(element: HTMLElement, options?: DragOptions) {
  const { handle, signal } = options ?? {};
  const pointerElement = handle ?? element;
  pointerElement.addEventListener(
    "pointerdown",
    (event: PointerEvent) => {
      if (event.button === PRIMARY_MOUSE_BUTTON) {
        new DragState(element, event.clientX, event.clientY);
      }
    },
    {
      passive: true,
      signal,
    },
  );
  element.addEventListener("contextmenu", cancelContextMenu, {
    passive: false,
    signal,
  });
}
