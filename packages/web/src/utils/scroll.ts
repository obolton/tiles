export function scrollIntoViewIfNeeded(
  element: Element,
  options?: ScrollIntoViewOptions,
) {
  const rect = element.getBoundingClientRect();
  if (rect.bottom < 0 || rect.top > window.innerHeight) {
    element.scrollIntoView(options);
  }
}
