import { afterEach, describe, expect, test, vi } from "vitest";
import { viewTransition } from "../transitions";
import { REDUCED_MOTION_QUERY, stubMatchMedia, unstubMatchMedia } from "@/test/mocks/matchMedia";

describe("viewTransition", () => {
  afterEach(() => {
    Reflect.deleteProperty(document, "startViewTransition");
    unstubMatchMedia();
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

  test("skips the transition when the user prefers reduced motion", async () => {
    stubMatchMedia(REDUCED_MOTION_QUERY);
    const startViewTransition = vi.fn();
    Object.defineProperty(document, "startViewTransition", {
      value: startViewTransition,
      configurable: true,
    });
    const callback = vi.fn();
    const transition = viewTransition(callback);
    expect(startViewTransition).not.toHaveBeenCalled();
    await transition.finished;
    expect(callback).toHaveBeenCalledTimes(1);
  });
});
