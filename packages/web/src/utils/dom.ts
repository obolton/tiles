import { getFocusedDescendant } from "./focus";

/**
 * Move a Node with `Element.moveBefore` if the method is available, falling back to `Node.insertBefore`.
 * https://developer.mozilla.org/en-US/docs/Web/API/Element/moveBefore
 */
export function moveBefore(parent: Node, movedNode: Node, referenceNode: Node | null) {
  if (parent instanceof Element && typeof parent.moveBefore === "function") {
    parent.moveBefore(movedNode, referenceNode);
  } else {
    const focused = getFocusedDescendant(movedNode);

    parent.insertBefore(movedNode, referenceNode);

    // Restore focus
    if (focused instanceof HTMLElement) {
      focused.focus({ preventScroll: true });
    }
  }
}

/**
 * Gets the previous or next sibling element that meets a condition.
 */
export function getSibling(
  element: Element,
  direction: "previous" | "next",
  filter: (element: Element) => boolean = () => true,
): Element | null {
  let sibling =
    direction === "previous" ? element.previousElementSibling : element.nextElementSibling;

  while (sibling && !filter(sibling)) {
    sibling =
      direction === "previous" ? sibling.previousElementSibling : sibling.nextElementSibling;
  }

  return sibling;
}
