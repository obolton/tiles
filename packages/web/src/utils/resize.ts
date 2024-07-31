export class ResizeEvent extends Event {
  constructor(
    type: "resize:start" | "resize:resize" | "resize:cancel" | "resize:end",
    readonly size: {
      width: number;
      height: number;
    } | null,
  ) {
    super(type, { bubbles: true, cancelable: false });
  }
}

let state: {
  isResizing: boolean;
  element: HTMLElement;
  rect: DOMRect;
  outlineElement: HTMLElement | null;
  initialPointerX: number;
  initialPointerY: number;
  minWidth: number;
  minHeight: number;
} | null = null;

const DRAG_THRESHOLD = 10;

export function makeResizable(element: HTMLElement) {
  element.addEventListener("pointerdown", pointerDown, {
    capture: true,
    passive: false,
  });
  element.addEventListener("click", click, { capture: true, passive: false });
  element.dataset.resizable = "true";

  return () => {
    element.removeEventListener("pointerdown", pointerDown, { capture: true });
    element.removeEventListener("click", click, { capture: true });
    delete element.dataset.resizable;
  };
}

function getDimensions(clientX: number, clientY: number) {
  if (!state) {
    throw new Error("Resize state is not initialized");
  }

  const { rect, minWidth, minHeight } = state;
  const width = Math.max(clientX - rect.left, minWidth);
  const height = Math.max(clientY - rect.top, minHeight);
  return {
    width,
    height,
  };
}

// Suppress click events while resizing
function click(event: MouseEvent) {
  if (state?.isResizing) {
    event.preventDefault();
    event.stopPropagation();
  }
}

function startResizing(clientX: number, clientY: number) {
  if (!state) {
    throw new Error("Resize state is not initialized");
  }

  const { element, rect } = state;

  state.isResizing = true;
  element.dataset.resizing = "true";
  document.body.style.setProperty("cursor", "nwse-resize");

  const style = getComputedStyle(element);
  state.minWidth = parseInt(style.getPropertyValue("min-width") ?? "0", 10);
  state.minHeight = parseInt(style.getPropertyValue("min-height") ?? "0", 10);

  const { width, height } = getDimensions(clientX, clientY);

  const outline = document.createElement("div");
  outline.className = "resize-outline";
  outline.style.setProperty("top", `${rect.top}px`);
  outline.style.setProperty("left", `${rect.left}px`);
  outline.style.setProperty("width", `${width}px`);
  outline.style.setProperty("height", `${height}px`);
  outline.style.setProperty(
    "border-radius",
    style.getPropertyValue("border-radius"),
  );
  state.outlineElement = outline;
  document.body.appendChild(outline);

  outline.animate([{ opacity: 0 }, { opacity: 0.8 }], {
    duration: 200,
    easing: "ease-in-out",
    fill: "forwards",
  });

  element.dispatchEvent(
    new ResizeEvent("resize:start", {
      width,
      height,
    }),
  );
}

function cleanUp() {
  if (!state) {
    return;
  }

  const { element, outlineElement } = state;
  delete element.dataset.dragging;
  document.body.style.removeProperty("cursor");

  if (outlineElement) {
    outlineElement
      .animate([{ opacity: 0.8 }, { opacity: 0 }], {
        duration: 200,
        easing: "ease-in-out",
        fill: "forwards",
      })
      .addEventListener("finish", () => outlineElement?.remove(), {
        once: true,
      });
  }

  // Wait for pointer events to complete before resetting state
  requestAnimationFrame(() => {
    state = null;
  });
}

function keyDown(event: KeyboardEvent) {
  if (event.key === "Escape" && state?.isResizing) {
    event.preventDefault();
    state.element.dispatchEvent(new ResizeEvent("resize:cancel", null));
    cleanUp();
  }
}

function pointerDown(event: PointerEvent) {
  if (
    !(event.currentTarget instanceof HTMLElement) ||
    !(event.target instanceof HTMLElement) ||
    !event.target.dataset.resize
  ) {
    return;
  }

  event.preventDefault();
  event.stopPropagation();

  const element = event.currentTarget;

  state = {
    isResizing: false,
    element,
    rect: element.getBoundingClientRect(),
    outlineElement: null,
    initialPointerX: event.clientX,
    initialPointerY: event.clientY,
    minWidth: 0,
    minHeight: 0,
  };

  window.addEventListener("pointermove", pointerMove, { passive: true });
  window.addEventListener("pointerup", pointerUp, {
    once: true,
    passive: true,
  });
  window.addEventListener("keydown", keyDown, {
    once: true,
  });
  // Disable scrolling while dragging with touch
  if (event.pointerType === "touch") {
    window.addEventListener("touchmove", touchMove, { passive: false });
  }
}

function pointerMove(event: PointerEvent) {
  if (!state) {
    return;
  }

  const {
    element,
    isResizing,
    initialPointerX,
    initialPointerY,
    outlineElement,
  } = state;

  if (isResizing) {
    const { width, height } = getDimensions(event.clientX, event.clientY);

    element.dispatchEvent(
      new ResizeEvent("resize:resize", {
        width,
        height,
      }),
    );

    requestAnimationFrame(() => {
      outlineElement?.style.setProperty("width", `${width}px`);
      outlineElement?.style.setProperty("height", `${height}px`);
    });
  } else {
    const deltaX = event.clientX - initialPointerX;
    const deltaY = event.clientY - initialPointerY;
    const distance = Math.sqrt(Math.pow(deltaX, 2) + Math.pow(deltaY, 2));
    if (distance >= DRAG_THRESHOLD) {
      startResizing(event.clientX, event.clientY);
    }
  }
}

function touchMove(event: TouchEvent) {
  event.preventDefault();
}

function pointerUp(event: PointerEvent) {
  window.removeEventListener("pointermove", pointerMove);
  window.removeEventListener("keydown", keyDown);
  window.removeEventListener("touchmove", touchMove);

  if (state?.isResizing) {
    state.element.dispatchEvent(
      new ResizeEvent(
        "resize:end",
        getDimensions(event.clientX, event.clientY),
      ),
    );
  }

  cleanUp();
}
