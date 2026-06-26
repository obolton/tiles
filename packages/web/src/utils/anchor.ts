export interface TrackAnchorOptions {
  signal: AbortSignal;
}

/**
 * Anchors `element` to `target`.
 */
export function trackAnchor(
  element: HTMLElement,
  target: Element,
  { signal }: TrackAnchorOptions,
): void {
  let frame = 0;
  const last = { x: NaN, y: NaN, width: NaN, height: NaN };

  const loop = () => {
    if (signal.aborted) {
      return;
    }

    const rect = target.getBoundingClientRect();

    if (rect.x !== last.x || rect.y !== last.y) {
      last.x = rect.x;
      last.y = rect.y;
      element.style.translate = `${rect.x}px ${rect.y}px`;
    }

    if (rect.width !== last.width || rect.height !== last.height) {
      last.width = rect.width;
      last.height = rect.height;
      element.style.width = `${rect.width}px`;
      element.style.height = `${rect.height}px`;
    }

    frame = requestAnimationFrame(loop);
  };

  frame = requestAnimationFrame(loop);
  signal.addEventListener("abort", () => cancelAnimationFrame(frame), {
    once: true,
  });
}
