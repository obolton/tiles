export function focusInside(element: Element, options?: FocusOptions) {
  // https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Global_attributes/tabindex
  element
    .querySelector<HTMLElement>(
      'a[href], area[href], button, iframe, input, object, select, summary, textarea, [contenteditable="true"], [tabindex]:not([tabindex="-1"])',
    )
    ?.focus(options);
}

export function getFocusedElementWithin(element: Element) {
  return element.contains(document.activeElement)
    ? document.activeElement
    : null;
}
