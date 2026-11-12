import { vi } from "vitest";

export const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

/** Stubs `matchMedia` so that only the given queries match. */
export function stubMatchMedia(...matchingQueries: string[]) {
  Object.defineProperty(globalThis, "matchMedia", {
    configurable: true,
    writable: true,
    value: vi.fn((query: string) => ({ matches: matchingQueries.includes(query) })),
  });
}

export function unstubMatchMedia() {
  Reflect.deleteProperty(globalThis, "matchMedia");
}
