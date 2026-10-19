/**
 * Move a Node with `Element.moveBefore` if the method is available, falling back to `Node.insertBefore`.
 * https://developer.mozilla.org/en-US/docs/Web/API/Element/moveBefore
 */
export function moveBefore(parent: Node, movedNode: Node, referenceNode: Node | null) {
  if (parent instanceof Element && typeof parent.moveBefore === "function") {
    parent.moveBefore(movedNode, referenceNode);
  } else {
    const focused = movedNode.contains(document.activeElement) ? document.activeElement : null;

    parent.insertBefore(movedNode, referenceNode);

    // Restore focus
    if (focused instanceof HTMLElement) {
      focused.focus({ preventScroll: true });
    }
  }
}
