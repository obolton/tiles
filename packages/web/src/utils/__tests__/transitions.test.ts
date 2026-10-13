import { afterEach, describe, expect, test, vi } from "vitest";
import { viewTransition } from "../transitions";

describe("viewTransition", () => {
  afterEach(() => {
    Reflect.deleteProperty(document, "startViewTransition");
  });

  test("calls startViewTransition when available", () => {
    const startViewTransition = vi.fn();
    Object.defineProperty(document, "startViewTransition", {
      value: startViewTransition,
      configurable: true,
    });
    const callback = vi.fn();
    viewTransition(callback);
    expect(startViewTransition).toHaveBeenCalledWith(callback);
  });

  test("defers the callback via microtask when startViewTransition is not available", async () => {
    const callback = vi.fn();
    viewTransition(callback);
    expect(callback).not.toHaveBeenCalled();
    await Promise.resolve();
    expect(callback).toHaveBeenCalledTimes(1);
  });
});
