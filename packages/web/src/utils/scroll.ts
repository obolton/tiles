export function scrollIntoViewIfNeeded(
  element: Element,
  options?: ScrollIntoViewOptions,
) {
  const rect = element.getBoundingClientRect();
  if (rect.bottom < 0 || rect.top > window.innerHeight) {
    element.scrollIntoView(options);
  }
}

export function scrollIntoView(elementId: string) {
  const element = document.getElementById(elementId);
  element?.scrollIntoView({ behavior: "smooth" });
}
