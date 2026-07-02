import { vi } from "vitest";

export default class IntersectionObserver implements globalThis.IntersectionObserver {
  static instances: IntersectionObserver[] = [];

  readonly root: Document | Element | null = null;
  readonly rootMargin: string = "";
  readonly scrollMargin: string = "";
  readonly thresholds: readonly number[] = [];

  observe: (element: Element) => void = vi.fn();
  unobserve: (element: Element) => void = vi.fn();
  disconnect: () => void = vi.fn();
  takeRecords: () => IntersectionObserverEntry[] = vi.fn(() => []);

  constructor(
    private readonly callback: IntersectionObserverCallback,
    readonly options?: IntersectionObserverInit,
  ) {
    IntersectionObserver.instances.push(this);
  }

  trigger(isIntersecting = true, target: Element = document.body) {
    const rect = target.getBoundingClientRect();
    this.callback(
      [
        {
          target,
          isIntersecting,
          intersectionRatio: isIntersecting ? 1 : 0,
          boundingClientRect: rect,
          intersectionRect: rect,
          rootBounds: null,
          time: 0,
        },
      ],
      this,
    );
  }
}
