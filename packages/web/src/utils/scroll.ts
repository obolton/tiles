/**
 * Scrolls a container to reveal a descendant element, if it is not
 * already fully visible within the container's bounds.
 */
export function reveal(
  container: Element,
  element: Element,
  options?: ScrollToOptions,
) {
  const containerRect = container.getBoundingClientRect();
  const elementRect = element.getBoundingClientRect();

  let top: number | undefined;
  let left: number | undefined;

  if (elementRect.top < containerRect.top) {
    top = elementRect.top - containerRect.top + container.scrollTop;
  } else if (elementRect.bottom > containerRect.bottom) {
    top = elementRect.bottom - containerRect.bottom + container.scrollTop;
  }

  if (elementRect.left < containerRect.left) {
    left = elementRect.left - containerRect.left + container.scrollLeft;
  } else if (elementRect.right > containerRect.right) {
    left = elementRect.right - containerRect.right + container.scrollLeft;
  }

  if (top !== undefined || left !== undefined) {
    container.scroll({
      ...options,
      top,
      left,
    });
  }
}

export function scrollIntoViewIfNeeded(
  element: Element,
  options?: ScrollIntoViewOptions,
) {
  const rect = element.getBoundingClientRect();

  // Element is outside the viewport
  if (
    rect.bottom < 0 ||
    rect.top > window.innerHeight ||
    rect.right < 0 ||
    rect.left > window.innerWidth
  ) {
    element.scrollIntoView(options);
    return;
  }

  // Element is outside the parent (assumes parent is a scroll container)
  const parentRect = element.parentElement?.getBoundingClientRect();
  if (
    parentRect &&
    (rect.bottom < parentRect.top ||
      rect.top > parentRect.bottom ||
      rect.right < parentRect.left ||
      rect.left > parentRect.right)
  ) {
    element.scrollIntoView(options);
  }
}
