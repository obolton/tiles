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
