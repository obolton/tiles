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
