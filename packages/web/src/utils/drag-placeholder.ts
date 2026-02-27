import { getSibling } from "./dom";

export interface DragPlaceholderOptions {
  x?: number;
  y?: number;
  width?: number | null;
  height?: number;
  rowSpan?: number;
  freeform?: boolean;
}

/**
 * Creates a drag placeholder element with CSS custom properties.
 */
export function createDragPlaceholder(
  options: DragPlaceholderOptions = {},
): HTMLElement {
  const { x = 0, y = 0, width, height, rowSpan, freeform = false } = options;

  const placeholder = document.createElement("div");
  placeholder.classList.add("drag-placeholder");

  if (freeform) {
    placeholder.style.setProperty("--placeholder-x", x.toString());
    placeholder.style.setProperty("--placeholder-y", y.toString());
  }

  if (typeof width === "number") {
    placeholder.style.setProperty("--placeholder-width", width.toString());
  }
  if (height !== undefined) {
    placeholder.style.setProperty("--placeholder-height", height.toString());
  }
  if (rowSpan !== undefined) {
    placeholder.style.setProperty("--placeholder-rows", rowSpan.toString());
  }

  return placeholder;
}

export interface DragPositionResult {
  previous: Element | null;
  next: Element | null;
}

/**
 * Finds the insertion position for a dragged element based on pointer coordinates.
 * Returns the previous and next siblings for the insertion point.
 */
export function getDragPosition(
  container: HTMLElement,
  x: number,
  y: number,
  direction: "horizontal" | "vertical",
  filter: (element: Element) => boolean = () => true,
): DragPositionResult | null {
  for (const child of container.children) {
    if (!filter(child)) {
      continue;
    }

    const rect = child.getBoundingClientRect();

    if (direction === "vertical") {
      const midpoint = rect.y + rect.height / 2;

      if (y >= rect.top && y <= rect.bottom) {
        if (y < midpoint) {
          return {
            previous: getSibling(child, "previous", filter),
            next: child,
          };
        } else {
          return {
            previous: child,
            next: getSibling(child, "next", filter),
          };
        }
      }
    }

    if (direction === "horizontal") {
      const midpoint = rect.x + rect.width / 2;

      if (x >= rect.left && x <= rect.right) {
        if (x < midpoint) {
          return {
            previous: getSibling(child, "previous", filter),
            next: child,
          };
        } else {
          return {
            previous: child,
            next: getSibling(child, "next", filter),
          };
        }
      }
    }
  }

  return null;
}
