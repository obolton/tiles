export function getCenter(rect: DOMRect) {
  return new DOMPoint(rect.x + rect.width / 2, rect.y + rect.height / 2);
}

export function getOffsetCenter(element: HTMLElement) {
  return new DOMPoint(
    element.offsetLeft + element.offsetWidth / 2,
    element.offsetTop + element.offsetHeight / 2,
  );
}

export function getDistance(a: DOMPoint, b: DOMPoint) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}
