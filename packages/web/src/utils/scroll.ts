export function scrollIntoViewIfNeeded(
  element: Element,
  options?: ScrollIntoViewOptions,
) {
  const rect = element.getBoundingClientRect();
  if (rect.top < 0 || rect.bottom > window.innerHeight) {
    element.scrollIntoView(options);
  }
}
