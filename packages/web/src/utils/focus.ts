export function focusInside(element: HTMLElement, options?: FocusOptions) {
  // https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Global_attributes/tabindex
  const focusElement =
    element.querySelector<HTMLElement>("[autofocus]") ??
    element.querySelector<HTMLElement>(
      'a[href], area[href], button, iframe, input, object, select, summary, textarea, [contenteditable="true"], [tabindex]:not([tabindex="-1"])',
    ) ??
    element;
  focusElement.focus(options);
}

export function getFocusedDescendant(node: Node) {
  return node.contains(document.activeElement) ? document.activeElement : null;
}
