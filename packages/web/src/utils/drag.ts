import { PRIMARY_MOUSE_BUTTON } from "@/constants/input";
import { viewTransition } from "./transitions";

const DRAG_THRESHOLD = 10; // px
const SCROLL_MARGIN = 50; // px from viewport edge
const SCROLL_INTERVAL = 16; // ms
const DRAG_EVENT_INTERVAL = 300; // ms
const MAX_SCROLL_SPEED = 20; // px per scroll
const LONG_PRESS_DURATION = 500; // ms

type ConstrainDragOptions = "horizontal" | "vertical";

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
  private readonly constrain?: ConstrainDragOptions;
  private readonly abortController = new AbortController();

  private isDragging = false;
  private dragElement?: HTMLElement;
  private dropTarget?: HTMLElement;
  private longPressTimeout?: ReturnType<typeof setTimeout>;
  private dragInterval?: ReturnType<typeof setInterval>;
  private scrollInterval?: ReturnType<typeof setInterval>;
  private scrollSpeed = 0;
  private pendingDragEvent: { x: number; y: number } | null = null;

  constructor(
    element: HTMLElement,
    startX: number,
    startY: number,
    constrain?: ConstrainDragOptions,
  ) {
    this.element = element;
    this.startX = startX;
    this.startY = startY;
    this.constrain = constrain;

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
      case "pointerleave":
        return this.pointerLeave(event as PointerEvent);
      case "click":
        return this.click(event as MouseEvent);
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

    if (allowDrop) {
      this.dropTarget = target;
      target.dataset.dropTarget = "true";
      this.scheduleDragEvent(event.clientX, event.clientY);
    } else {
      this.dropTarget = undefined;
    }

    target.addEventListener("pointerleave", this, {
      once: true,
      signal: this.abortController.signal,
    });
  }

  private pointerMove(event: PointerEvent) {
    this.cancelLongPress();

    const x = this.constrain === "vertical" ? this.startX : event.clientX;
    const y = this.constrain === "horizontal" ? this.startY : event.clientY;

    if (this.isDragging) {
      this.scheduleDragEvent(x, y);

      requestAnimationFrame(() => {
        const deltaX = x - this.originX;
        const deltaY = y - this.originY;
        this.dragElement?.style.setProperty("--translate-x", `${deltaX}px`);
        this.dragElement?.style.setProperty("--translate-y", `${deltaY}px`);
      });
    } else if (event.pointerType !== "touch") {
      const deltaX = x - this.startX;
      const deltaY = y - this.startY;

      if (Math.hypot(deltaX, deltaY) >= DRAG_THRESHOLD) {
        this.startDrag(x, y);
      }
    }

    if (y <= SCROLL_MARGIN) {
      this.scrollSpeed = -(SCROLL_MARGIN - y);
      this.scrollInterval ??= setInterval(
        this.scroll.bind(this),
        SCROLL_INTERVAL,
      );
    } else if (window.innerHeight - y <= SCROLL_MARGIN) {
      this.scrollSpeed = SCROLL_MARGIN - (window.innerHeight - y);
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

  private pointerLeave(event: PointerEvent) {
    const target = event.currentTarget as HTMLElement;

    delete target.dataset.dropTarget;
    target.dispatchEvent(
      this.createDragDropEvent("dnd-dragleave", {
        bubbles: true,
        cancelable: false,
        clientX: event.clientX,
        clientY: event.clientY,
      }),
    );

    this.dropTarget = undefined;
  }

  private click(event: MouseEvent) {
    event.preventDefault();
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
    this.dragElement.removeAttribute("data-animate-layout-id");
    this.dragElement
      .querySelectorAll("[data-animate-layout-id]")
      .forEach((element) => element.removeAttribute("data-animate-layout-id"));

    const rect = this.element.getBoundingClientRect();

    const rotateX = (this.originX / rect.width - 0.5) * -2;
    const rotateY = (this.originY / rect.height - 0.5) * 2;
    const rotateAngle = 5 * Math.hypot(rotateX, rotateY);

    const style = this.dragElement.style;
    style.width = rect.width + "px";
    style.height = rect.height + "px";
    style.transformOrigin = `${this.originX}px ${this.originY}px`;
    style.setProperty("--translate-x", clientX - this.originX + "px");
    style.setProperty("--translate-y", clientY - this.originY + "px");
    style.setProperty("--rotate-x", rotateX.toFixed(3));
    style.setProperty("--rotate-y", rotateY.toFixed(3));
    style.setProperty("--rotate-angle", rotateAngle.toFixed(3) + "deg");

    document.body.appendChild(this.dragElement);
    this.dragElement.showPopover();

    this.dragInterval = setInterval(
      this.processPendingDragEvent.bind(this),
      DRAG_EVENT_INTERVAL,
    );

    // Suppress click events
    addEventListener("click", this, {
      passive: false,
      signal: this.abortController.signal,
    });
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
    // Allow remaining event listeners to fire
    setTimeout(() => this.abortController.abort(), 0);

    this.cancelLongPress();
    clearInterval(this.scrollInterval);
    clearInterval(this.dragInterval);

    if (this.isDragging) {
      if (this.dropTarget) {
        delete this.dropTarget.dataset.dropTarget;
        this.dropTarget.dispatchEvent(
          this.createDragDropEvent("dnd-dragleave", {
            bubbles: true,
            cancelable: false,
          }),
        );
      }

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

    this.isDragging = false;
    this.dropTarget = undefined;

    // Animate the drag element to its final position
    if (this.dragElement) {
      if (this.destination) {
        this.dragElement.style.viewTransitionName = "drop";
      }

      viewTransition(() => {
        delete document.body.dataset.drag;
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

function preventDefault(event: Event) {
  event.preventDefault();
}

export interface MakeDraggableOptions {
  handle?: HTMLElement;
  constrain?: ConstrainDragOptions;
  signal?: AbortSignal;
}

export function makeDraggable(
  element: HTMLElement,
  options?: MakeDraggableOptions,
) {
  const { handle, signal, constrain } = options ?? {};
  const pointerElement = handle ?? element;
  pointerElement.addEventListener(
    "pointerdown",
    (event: PointerEvent) => {
      if (event.button === PRIMARY_MOUSE_BUTTON) {
        new DragState(element, event.clientX, event.clientY, constrain);
      }
    },
    {
      passive: true,
      signal,
    },
  );
  element.addEventListener("dragstart", preventDefault, { signal });
  element.addEventListener("contextmenu", cancelContextMenu, {
    signal,
  });
}
