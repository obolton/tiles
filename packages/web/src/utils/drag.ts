const DRAG_THRESHOLD = 10;
const PRIMARY_MOUSE_BUTTON = 0;
const LONG_PRESS_DURATION = 500;

let dragSource: HTMLElement | null = null;
let dragElement: HTMLElement | null = null;
let initialPointerX: number;
let initialPointerY: number;
let rect: DOMRect | null = null;
let isDragging = false;
let longPressTimeout: ReturnType<typeof setTimeout> | null = null;

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

  dragSource = event.currentTarget;
  initialPointerX = event.clientX;
  initialPointerY = event.clientY;
  rect = dragSource.getBoundingClientRect();

  window.addEventListener("pointermove", pointerMove, { passive: true });
  window.addEventListener("pointerup", pointerUp, { passive: true });
  longPressTimeout = setTimeout(() => {
    startDrag();

    // Disable scrolling while dragging with touch
    if (event.pointerType === "touch") {
      window.addEventListener("touchmove", touchMove, { passive: false });
    }
  }, LONG_PRESS_DURATION);
}

function pointerMove(event: PointerEvent) {
  if (!dragSource || !rect) {
    return;
  }

  // Cancel long press
  if (longPressTimeout !== null) {
    clearTimeout(longPressTimeout);
    longPressTimeout = null;
    return;
  }

  const deltaX = event.clientX - initialPointerX;
  const deltaY = event.clientY - initialPointerY;

  if (isDragging) {
    requestAnimationFrame(() => {
      if (dragElement && rect) {
        dragElement.style.setProperty("--translate-x", `${deltaX}px`);
        dragElement.style.setProperty("--translate-y", `${deltaY}px`);
      }
    });
  } else if (event.pointerType !== "touch") {
    const distance = Math.sqrt(Math.pow(deltaX, 2) + Math.pow(deltaY, 2));
    if (distance >= DRAG_THRESHOLD) {
      startDrag(deltaX, deltaY);
    }
  }
}

function touchMove(event: TouchEvent) {
  event.preventDefault();
}

function startDrag(translateX: number = 0, translateY: number = 0) {
  if (!dragSource || !rect || isDragging) {
    return;
  }

  isDragging = true;

  dragElement = dragSource.cloneNode(true) as HTMLElement;
  dragElement.dataset.dragPreview = "true";
  delete dragElement.dataset.dropTarget;

  dragElement.style.setProperty("width", `${rect.width}px`);
  dragElement.style.setProperty("height", `${rect.height}px`);
  dragElement.style.setProperty("--initial-x", `${rect.left}px`);
  dragElement.style.setProperty("--initial-y", `${rect.top}px`);
  dragElement.style.setProperty("--translate-x", `${translateX}px`);
  dragElement.style.setProperty("--translate-y", `${translateY}px`);

  const offsetX = initialPointerX - rect.left;
  const offsetY = initialPointerY - rect.top;
  const rotateX = (offsetX / rect.width - 0.5) * -2;
  const rotateY = (offsetY / rect.height - 0.5) * 2;
  const rotateAngle =
    5 * Math.sqrt(Math.pow(rotateX, 2) + Math.pow(rotateY, 2));

  dragElement.style.setProperty("--transform-origin-x", `${offsetX}px`);
  dragElement.style.setProperty("--transform-origin-y", `${offsetY}px`);
  dragElement.style.setProperty("--rotate-x", `${rotateX}`);
  dragElement.style.setProperty("--rotate-y", `${rotateY}`);
  dragElement.style.setProperty("--rotate-angle", `${rotateAngle}deg`);

  document.body.appendChild(dragElement);
  document.body.style.setProperty("cursor", "grab");

  dragSource.dataset.dragging = "true";

  enableDropTargetEvents();
}

function pointerUp(event: PointerEvent) {
  if (event.button !== PRIMARY_MOUSE_BUTTON) {
    return;
  }

  // Cancel long press
  if (longPressTimeout !== null) {
    clearTimeout(longPressTimeout);
    longPressTimeout = null;
  }

  window.removeEventListener("pointermove", pointerMove);
  window.removeEventListener("touchmove", touchMove);
  window.removeEventListener("pointerup", pointerUp);

  if (!dragSource || !isDragging) {
    return;
  }

  delete dragSource.dataset.dragging;

  // Animate the drag element image to its final position
  if (dragElement && rect) {
    const destinationRect = dragSource.getBoundingClientRect();
    const deltaX = destinationRect.left - rect.left;
    const deltaY = destinationRect.top - rect.top;
    const animation = dragElement.animate(
      [
        {
          transform: `translate(${deltaX}px, ${deltaY}px)`,
          boxShadow: "inherit",
        },
      ],
      {
        duration: 200,
        easing: "ease-in-out",
      },
    );
    animation.addEventListener(
      "finish",
      () => {
        dragElement?.remove();
        dragElement = null;
      },
      { once: true },
    );
  }

  disableDropTargetEvents();
  document.body.style.removeProperty("cursor");

  dragSource.dispatchEvent(new DragDropEvent("drag:drop", dragSource));

  // Wait for pointer events to complete before resetting state
  requestAnimationFrame(() => {
    isDragging = false;
    dragSource = null;
    rect = null;
  });
}

function pointerEnterDropTarget(event: PointerEvent) {
  if (!(event.currentTarget instanceof HTMLElement) || !dragSource) {
    return;
  }
  event.currentTarget.dispatchEvent(
    new DragDropEvent("drag:drag-over", dragSource),
  );
}

function getDropTargets() {
  return document.querySelectorAll<HTMLElement>('[data-drop-target="true"]');
}

function enableDropTargetEvents() {
  getDropTargets().forEach((element) => {
    element.addEventListener("pointerenter", pointerEnterDropTarget);
  });
}

function disableDropTargetEvents() {
  getDropTargets().forEach((element) =>
    element.removeEventListener("pointerenter", pointerEnterDropTarget),
  );
}

// Prevent click events while dragging
function click(event: MouseEvent) {
  if (isDragging) {
    event.preventDefault();
    event.stopPropagation();
  }
}

function contextMenu(event: PointerEvent | MouseEvent) {
  if (event instanceof PointerEvent && event.pointerType === "touch") {
    event.preventDefault();
  }
}

export function makeDraggable(element: HTMLElement) {
  element.addEventListener("pointerdown", pointerDown, { passive: false });
  element.addEventListener("click", click, { capture: true, passive: false });
  element.addEventListener("contextmenu", contextMenu, { passive: false });
  element.dataset.draggable = "true";

  return () => {
    element.removeEventListener("pointerdown", pointerDown);
    element.removeEventListener("click", click, { capture: true });
    element.removeEventListener("contextmenu", contextMenu);
    delete element.dataset.draggable;
  };
}
