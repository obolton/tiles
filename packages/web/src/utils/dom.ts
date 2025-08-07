declare global {
  interface Element {
    moveBefore?(movedNode: Node, referenceNode: Node | null): void;
  }
}

/**
 * Move a Node with `Element.moveBefore` if the method is available, falling back to `Element.insertBefore`.
 * https://developer.mozilla.org/en-US/docs/Web/API/Element/moveBefore
 */
export function moveBefore(
  parent: Element,
  movedNode: Node,
  referenceNode: Node | null,
) {
  if (typeof parent.moveBefore === "function") {
    parent.moveBefore(movedNode, referenceNode);
  } else {
    parent.insertBefore(movedNode, referenceNode);
  }
}
