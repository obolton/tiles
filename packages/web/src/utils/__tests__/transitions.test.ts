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

  test("calls the callback immediately when startViewTransition is not available", () => {
    vi.stubGlobal("document", {
      startViewTransition: undefined,
    });
    const callback = vi.fn();
    viewTransition(callback);
    expect(callback).toHaveBeenCalled();
  });
});
