import { PRIMARY_MOUSE_BUTTON } from "@/constants/input";
import { viewTransition } from "./transitions";

const DRAG_THRESHOLD = 10; // px
const SCROLL_MARGIN = 50; // px from viewport edge
const SCROLL_INTERVAL = 16; // ms
const MAX_SCROLL_SPEED = 20; // px per scroll
const LONG_PRESS_DURATION = 500; // ms

type ConstrainDragOptions = "horizontal" | "vertical";

export interface DragDropEventMap {
  "dnd-dragstart": DragDropEvent;
  "dnd-dragend": DragDropEvent;
  "dnd-dragenter": DragDropEvent;
  "dnd-dragleave": DragDropEvent;
  "dnd-drag": DragDropEvent;
  "dnd-dragover": DragDropEvent;
  "dnd-drop": DragDropEvent;
}

declare global {
  interface HTMLElementEventMap extends DragDropEventMap {}
}

export interface DragDropEventInit<T> extends EventInit {
  state: DragState<T>;
  dragSource: HTMLElement;
  dragPreview: HTMLElement | null;
  dropTarget?: HTMLElement;
  clientX?: number;
  clientY?: number;
  altKey?: boolean;
}

export class DragDropEvent<T = unknown> extends Event {
  readonly state: DragState<T>;
  readonly dragSource: HTMLElement;
  readonly dragPreview: HTMLElement | null;
  readonly dropTarget?: HTMLElement;
  readonly clientX: number;
  readonly clientY: number;
  readonly altKey: boolean;

  constructor(type: keyof DragDropEventMap, options: DragDropEventInit<T>) {
    const {
      state,
      dragSource,
      dragPreview,
      dropTarget,
      clientX = 0,
      clientY = 0,
      altKey = false,
      ...init
    } = options || {};
    super(type, init);

    this.state = state;
    this.dragSource = dragSource;
    this.dragPreview = dragPreview;
    this.dropTarget = dropTarget;
    this.clientX = clientX;
    this.clientY = clientY;
    this.altKey = altKey;
  }
}

export interface DragStateOptions {
  element: HTMLElement;
  startX: number;
  startY: number;
  pointerType: string;
  constrain?: ConstrainDragOptions;
  clone?: boolean;
}

export class DragState<T = unknown> {
  static attach<T = unknown>(options: DragStateOptions): DragState<T> {
    return new DragState<T>(options);
  }

  readonly element: HTMLElement;
  readonly offsetX: number;
  readonly offsetY: number;
  readonly width: number;
  readonly height: number;

  data?: T;

  private readonly startX: number;
  private readonly startY: number;
  private readonly constrain?: ConstrainDragOptions;
  private readonly clone: boolean;
  private readonly abortController = new AbortController();

  private isDragging = false;
  private dragPreview: HTMLElement | null = null;
  private dropTarget?: HTMLElement;
  private longPressTimeout?: ReturnType<typeof setTimeout>;
  private scrollInterval?: ReturnType<typeof setInterval>;
  private scrollSpeed = 0;

  constructor({
    element,
    startX,
    startY,
    pointerType,
    constrain,
    clone = false,
  }: DragStateOptions) {
    this.element = element;
    this.startX = startX;
    this.startY = startY;
    this.constrain = constrain;
    this.clone = clone;

    const rect = element.getBoundingClientRect();
    this.offsetX = startX - rect.x;
    this.offsetY = startY - rect.y;
    this.width = rect.width;
    this.height = rect.height;

    const signal = this.abortController.signal;

    addEventListener("pointermove", this, {
      passive: true,
      signal,
    });
    addEventListener("pointerup", this, {
      passive: true,
      signal,
    });
    addEventListener("pointercancel", this, {
      passive: true,
      signal,
    });
    addEventListener("keydown", this, {
      passive: false,
      signal,
    });
    element.addEventListener("contextmenu", this, {
      signal,
    });

    if (pointerType === "touch") {
      // Disable scrolling while dragging with touch
      addEventListener("touchmove", (event) => event.preventDefault(), {
        passive: false,
        signal,
      });

      this.longPressTimeout = setTimeout(
        () => this.startDrag(this.startX, this.startY),
        LONG_PRESS_DURATION,
      );
    }
  }

  handleEvent(event: Event) {
    switch (event.type) {
      case "pointerover":
        return this.pointerOver(event as PointerEvent);
      case "pointermove":
        return this.pointerMove(event as PointerEvent);
      case "pointerup":
        return this.pointerUp(event as PointerEvent);
      case "pointercancel":
        return this.pointerCancel();
      case "pointerleave":
        return this.pointerLeave(event as PointerEvent);
      case "click":
        return this.click(event as MouseEvent);
      case "keydown":
        return this.keyDown(event as KeyboardEvent);
      case "contextmenu":
        return this.contextMenu(event as PointerEvent);
    }
  }

  private createDragDropEvent(
    type: keyof DragDropEventMap,
    options: Partial<DragDropEventInit<T>> = {},
  ) {
    return new DragDropEvent(type, {
      state: this,
      dragSource: this.element,
      dragPreview: this.dragPreview,
      dropTarget: this.dropTarget,
      ...options,
    });
  }

  private cancelLongPress() {
    clearTimeout(this.longPressTimeout);
  }

  private findDropTarget(child: HTMLElement, clientX: number, clientY: number, altKey: boolean) {
    const target = child.closest<HTMLElement>('[data-drop="true"]');
    if (!target || target === this.dropTarget) {
      return;
    }

    const allowDrop = target.dispatchEvent(
      this.createDragDropEvent("dnd-dragenter", {
        bubbles: true,
        cancelable: true,
        clientX,
        clientY,
        altKey,
      }),
    );

    if (allowDrop) {
      this.dropTarget = target;
      target.dataset.dropTarget = "true";
      this.dispatchDragEvents(clientX, clientY, altKey);
    } else {
      this.dropTarget = undefined;
    }

    target.addEventListener("pointerleave", this, {
      signal: this.abortController.signal,
    });
  }

  // Pointer events

  private pointerOver(event: PointerEvent) {
    if (event.target instanceof HTMLElement) {
      this.findDropTarget(event.target, event.clientX, event.clientY, event.altKey);
    }
  }

  private pointerMove(event: PointerEvent) {
    this.cancelLongPress();

    const { clientX, clientY, altKey } = event;
    const x = this.constrain === "vertical" ? this.startX : clientX;
    const y = this.constrain === "horizontal" ? this.startY : clientY;

    if (this.isDragging) {
      const originX = x - this.offsetX;
      const originY = y - this.offsetY;

      this.dispatchDragEvents(clientX, clientY, altKey);

      requestAnimationFrame(() => {
        this.dragPreview?.style.setProperty("--drag-x", originX + "px");
        this.dragPreview?.style.setProperty("--drag-y", originY + "px");
      });

      // Auto-scroll when dragging near viewport edges
      if (clientY <= SCROLL_MARGIN) {
        this.scrollSpeed = -(SCROLL_MARGIN - clientY);
        this.scrollInterval ??= setInterval(this.scroll.bind(this), SCROLL_INTERVAL);
      } else if (window.innerHeight - clientY <= SCROLL_MARGIN) {
        this.scrollSpeed = SCROLL_MARGIN - (window.innerHeight - clientY);
        this.scrollInterval ??= setInterval(this.scroll.bind(this), SCROLL_INTERVAL);
      } else if (typeof this.scrollInterval !== "undefined") {
        clearInterval(this.scrollInterval);
        this.scrollInterval = undefined;
      }
    } else if (event.pointerType !== "touch") {
      const deltaX = x - this.startX;
      const deltaY = y - this.startY;

      if (Math.hypot(deltaX, deltaY) >= DRAG_THRESHOLD) {
        this.startDrag(clientX, clientY, altKey);
      }
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

  private pointerCancel() {
    this.finish();
  }

  private pointerLeave(event: PointerEvent) {
    // Ignore pointer events triggered by view transitions
    if (event.relatedTarget === document.documentElement) {
      return;
    }

    const target = event.currentTarget;
    if (!(target instanceof HTMLElement)) {
      return;
    }

    target.removeEventListener("pointerleave", this);

    delete target.dataset.dropTarget;
    target.dispatchEvent(
      this.createDragDropEvent("dnd-dragleave", {
        bubbles: true,
        cancelable: false,
        clientX: event.clientX,
        clientY: event.clientY,
      }),
    );

    if (target === this.dropTarget) {
      this.dropTarget = undefined;
    }
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

  // Prevent context menu on touch long-press (allows right-click for mouse)
  private contextMenu(event: PointerEvent) {
    if (event.pointerType === "touch") {
      event.preventDefault();
    }
  }

  // Drag lifecycle

  private startDrag(clientX: number, clientY: number, altKey = false) {
    if (this.isDragging) {
      return;
    }

    const allowDrag = this.element.dispatchEvent(
      this.createDragDropEvent("dnd-dragstart", {
        bubbles: true,
        cancelable: true,
        clientX,
        clientY,
        altKey,
      }),
    );

    if (!allowDrag) {
      this.finish();
      return;
    }

    this.isDragging = true;

    const rect = this.element.getBoundingClientRect();
    this.dragPreview = this.clone ? (this.element.cloneNode(true) as HTMLElement) : this.element;
    this.dragPreview.classList.add("drag-preview");
    this.dragPreview.popover = "manual";

    const style = this.dragPreview.style;
    style.setProperty("--drag-origin-x", this.offsetX + "px");
    style.setProperty("--drag-origin-y", this.offsetY + "px");
    style.setProperty("--drag-x", clientX - this.offsetX + "px");
    style.setProperty("--drag-y", clientY - this.offsetY + "px");
    style.setProperty("--drag-width", rect.width + "px");
    style.setProperty("--drag-height", rect.height + "px");

    if (this.clone) {
      this.element.parentElement?.appendChild(this.dragPreview);
    }

    document.body.dataset.drag = "true";
    this.dragPreview.showPopover();

    this.findDropTarget(this.element, clientX, clientY, altKey);

    // Suppress click events
    addEventListener("click", this, {
      passive: false,
      signal: this.abortController.signal,
    });

    addEventListener("pointerover", this, {
      passive: true,
      signal: this.abortController.signal,
    });
  }

  private drop(event: PointerEvent) {
    const dropTarget = this.dropTarget;

    this.dragPreview?.classList.add("drag-drop");

    viewTransition(() => {
      dropTarget?.dispatchEvent(
        this.createDragDropEvent("dnd-drop", {
          bubbles: true,
          cancelable: false,
          clientX: event.clientX,
          clientY: event.clientY,
          altKey: event.altKey,
        }),
      );

      this.removeDragPreview();
    }).updateCallbackDone.finally(() => {
      this.finish();
    });
  }

  private removeDragPreview() {
    if (!this.dragPreview) {
      return;
    }

    delete document.body.dataset.drag;
    this.dragPreview.classList.remove("drag-preview", "drag-drop");
    this.dragPreview.hidePopover();
    this.dragPreview.popover = null;

    if (this.clone) {
      this.dragPreview.remove();
    } else {
      this.dragPreview.style.removeProperty("--drag-origin-x");
      this.dragPreview.style.removeProperty("--drag-origin-y");
      this.dragPreview.style.removeProperty("--drag-x");
      this.dragPreview.style.removeProperty("--drag-y");
      this.dragPreview.style.removeProperty("--drag-width");
      this.dragPreview.style.removeProperty("--drag-height");
    }

    this.dragPreview = null;
  }

  private finish() {
    this.abortController.abort();

    this.cancelLongPress();
    clearInterval(this.scrollInterval);

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

      const dragEndTarget = this.element.isConnected ? this.element : document.body;

      dragEndTarget.dispatchEvent(
        this.createDragDropEvent("dnd-dragend", {
          bubbles: true,
          cancelable: false,
        }),
      );

      this.removeDragPreview();
    }

    this.isDragging = false;
    this.dropTarget = undefined;
  }

  private dispatchDragEvents(clientX: number, clientY: number, altKey: boolean) {
    this.element.dispatchEvent(
      this.createDragDropEvent("dnd-drag", {
        bubbles: true,
        cancelable: false,
        clientX,
        clientY,
        altKey,
      }),
    );

    this.dropTarget?.dispatchEvent(
      this.createDragDropEvent("dnd-dragover", {
        bubbles: true,
        cancelable: false,
        clientX,
        clientY,
        altKey,
      }),
    );
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

function preventDefault(event: Event) {
  event.preventDefault();
}

export interface MakeDraggableOptions {
  handle?: HTMLElement;
  constrain?: ConstrainDragOptions;
  clone?: boolean;
  signal?: AbortSignal;
}

export function makeDraggable(element: HTMLElement, options?: MakeDraggableOptions) {
  if (element.dataset.draggable === "true") {
    return;
  }
  element.dataset.draggable = "true";

  const { handle, signal, constrain, clone } = options ?? {};
  const pointerElement = handle ?? element;
  pointerElement.addEventListener(
    "pointerdown",
    (event: PointerEvent) => {
      if (event.button === PRIMARY_MOUSE_BUTTON && !event.defaultPrevented) {
        DragState.attach({
          element,
          startX: event.clientX,
          startY: event.clientY,
          pointerType: event.pointerType,
          constrain,
          clone,
        });
      }
    },
    {
      passive: true,
      signal,
    },
  );
  element.addEventListener("dragstart", preventDefault, { signal });

  signal?.addEventListener(
    "abort",
    () => {
      delete element.dataset.draggable;
    },
    { once: true },
  );
}
