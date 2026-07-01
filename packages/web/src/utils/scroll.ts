/**
 * Scrolls a container to reveal a descendant element, if it is not
 * fully visible within the container's bounds.
 */
export function reveal(container: Element, element: Element, options?: ScrollToOptions) {
  const containerRect = container.getBoundingClientRect();
  const elementRect = element.getBoundingClientRect();

  const containerStyle = getComputedStyle(container);
  const elementStyle = getComputedStyle(element);

  const padTop =
    (parseFloat(containerStyle.scrollPaddingTop) || 0) +
    (parseFloat(elementStyle.scrollMarginTop) || 0);
  const padBottom =
    (parseFloat(containerStyle.scrollPaddingBottom) || 0) +
    (parseFloat(elementStyle.scrollMarginBottom) || 0);
  const padLeft =
    (parseFloat(containerStyle.scrollPaddingLeft) || 0) +
    (parseFloat(elementStyle.scrollMarginLeft) || 0);
  const padRight =
    (parseFloat(containerStyle.scrollPaddingRight) || 0) +
    (parseFloat(elementStyle.scrollMarginRight) || 0);

  let top: number | undefined;
  let left: number | undefined;

  if (elementRect.top < containerRect.top + padTop) {
    top = elementRect.top - containerRect.top - padTop + container.scrollTop;
  } else if (elementRect.bottom > containerRect.bottom - padBottom) {
    top = elementRect.bottom - containerRect.bottom + padBottom + container.scrollTop;
  }

  if (elementRect.left < containerRect.left + padLeft) {
    left = elementRect.left - containerRect.left - padLeft + container.scrollLeft;
  } else if (elementRect.right > containerRect.right - padRight) {
    left = elementRect.right - containerRect.right + padRight + container.scrollLeft;
  }

  if (top !== undefined || left !== undefined) {
    container.scroll({
      ...options,
      top,
      left,
    });
  }
}

export function scrollIntoViewIfNeeded(element: Element, options?: ScrollIntoViewOptions) {
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
