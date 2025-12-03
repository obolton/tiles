import { describe, expect, test, vi, beforeAll } from "vitest";
import { viewTransition } from "../transitions";

describe("viewTransition", () => {
  beforeAll(() => {
    vi.stubGlobal("document", {
      startViewTransition: vi.fn(),
    });
  });

  test("calls startViewTransition when available", () => {
    const callback = vi.fn();
    viewTransition(callback);
    expect(document.startViewTransition).toHaveBeenCalledWith(callback);
  });

  test("defers the callback via microtask when startViewTransition is not available", async () => {
    vi.stubGlobal("document", {
      startViewTransition: undefined,
    });
    const callback = vi.fn();
    viewTransition(callback);
    expect(callback).not.toHaveBeenCalled();
    await Promise.resolve();
    expect(callback).toHaveBeenCalled();
  });
});
