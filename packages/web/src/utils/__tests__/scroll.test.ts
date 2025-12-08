import { beforeEach, describe, expect, test, vi } from "vitest";
import { scrollIntoViewIfNeeded } from "../scroll";

describe("scrollIntoViewIfNeeded", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  window.innerWidth = 800;
  window.innerHeight = 600;
  const options = { behavior: "smooth", block: "center" } as const;

  test("scrolls the element into view if it is clipped by the top of the viewport", () => {
    const element = document.createElement("div");
    vi.spyOn(element, "getBoundingClientRect").mockReturnValue(
      new DOMRect(0, -150, 100, 100),
    );
    const scrollIntoView = vi.spyOn(element, "scrollIntoView");
    scrollIntoViewIfNeeded(element, options);
    expect(scrollIntoView).toHaveBeenCalledWith(options);
  });

  test("scrolls the element into view if it is clipped by the bottom of the viewport", () => {
    const element = document.createElement("div");
    vi.spyOn(element, "getBoundingClientRect").mockReturnValue(
      new DOMRect(0, 650, 100, 100),
    );
    const scrollIntoView = vi.spyOn(element, "scrollIntoView");
    scrollIntoViewIfNeeded(element, options);
    expect(scrollIntoView).toHaveBeenCalledWith(options);
  });

  test("scrolls the element into view if it is clipped by the left of the viewport", () => {
    const element = document.createElement("div");
    vi.spyOn(element, "getBoundingClientRect").mockReturnValue(
      new DOMRect(-150, 0, 100, 100),
    );
    const scrollIntoView = vi.spyOn(element, "scrollIntoView");
    scrollIntoViewIfNeeded(element, options);
    expect(scrollIntoView).toHaveBeenCalledWith(options);
  });

  test("scrolls the element into view if it is clipped by the right of the viewport", () => {
    const element = document.createElement("div");
    vi.spyOn(element, "getBoundingClientRect").mockReturnValue(
      new DOMRect(0, 850, 100, 100),
    );
    const scrollIntoView = vi.spyOn(element, "scrollIntoView");
    scrollIntoViewIfNeeded(element, options);
    expect(scrollIntoView).toHaveBeenCalledWith(options);
  });

  test("does not scroll the element if it is fully visible", () => {
    const element = document.createElement("div");
    vi.spyOn(element, "getBoundingClientRect").mockReturnValue(
      new DOMRect(0, 50, 100, 100),
    );
    const scrollIntoView = vi.spyOn(element, "scrollIntoView");
    scrollIntoViewIfNeeded(element, options);
    expect(scrollIntoView).not.toHaveBeenCalled();
  });
});
