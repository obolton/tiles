import { beforeEach, describe, expect, test, vi } from "vitest";
import { reveal, scrollIntoViewIfNeeded } from "../scroll";

describe("reveal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const containerRect = new DOMRect(0, 100, 400, 300);

  test("does not scroll when element is fully visible", () => {
    const container = document.createElement("div");
    vi.spyOn(container, "getBoundingClientRect").mockReturnValue(containerRect);
    container.scroll = vi.fn();

    const element = document.createElement("div");
    vi.spyOn(element, "getBoundingClientRect").mockReturnValue(
      new DOMRect(50, 150, 100, 40),
    );

    reveal(container, element);
    expect(container.scroll).not.toHaveBeenCalled();
  });

  test("aligns top edge when element is above the container", () => {
    const container = document.createElement("div");
    vi.spyOn(container, "getBoundingClientRect").mockReturnValue(containerRect);
    container.scroll = vi.fn();

    const element = document.createElement("div");
    vi.spyOn(element, "getBoundingClientRect").mockReturnValue(
      new DOMRect(50, 60, 100, 40),
    );

    reveal(container, element);
    expect(container.scroll).toHaveBeenCalledWith({
      top: -40,
      left: undefined,
    });
  });

  test("aligns bottom edge when element is below the container", () => {
    const container = document.createElement("div");
    vi.spyOn(container, "getBoundingClientRect").mockReturnValue(containerRect);
    container.scroll = vi.fn();

    const element = document.createElement("div");
    vi.spyOn(element, "getBoundingClientRect").mockReturnValue(
      new DOMRect(50, 380, 100, 40),
    );

    reveal(container, element);
    expect(container.scroll).toHaveBeenCalledWith({ top: 20, left: undefined });
  });

  test("aligns left edge when element is left of the container", () => {
    const container = document.createElement("div");
    vi.spyOn(container, "getBoundingClientRect").mockReturnValue(
      new DOMRect(100, 0, 400, 300),
    );
    container.scroll = vi.fn();

    const element = document.createElement("div");
    vi.spyOn(element, "getBoundingClientRect").mockReturnValue(
      new DOMRect(60, 50, 40, 40),
    );

    reveal(container, element);
    expect(container.scroll).toHaveBeenCalledWith({
      top: undefined,
      left: -40,
    });
  });

  test("aligns right edge when element is right of the container", () => {
    const container = document.createElement("div");
    vi.spyOn(container, "getBoundingClientRect").mockReturnValue(
      new DOMRect(100, 0, 400, 300),
    );
    container.scroll = vi.fn();

    const element = document.createElement("div");
    vi.spyOn(element, "getBoundingClientRect").mockReturnValue(
      new DOMRect(480, 50, 40, 40),
    );

    reveal(container, element);
    expect(container.scroll).toHaveBeenCalledWith({ top: undefined, left: 20 });
  });

  test("accounts for existing scroll position", () => {
    const container = document.createElement("div");
    vi.spyOn(container, "getBoundingClientRect").mockReturnValue(containerRect);
    Object.defineProperty(container, "scrollTop", { value: 200 });
    container.scroll = vi.fn();

    const element = document.createElement("div");
    vi.spyOn(element, "getBoundingClientRect").mockReturnValue(
      new DOMRect(50, 60, 100, 40),
    );

    reveal(container, element);
    expect(container.scroll).toHaveBeenCalledWith({
      top: 160,
      left: undefined,
    });
  });

  test("passes scroll options through", () => {
    const container = document.createElement("div");
    vi.spyOn(container, "getBoundingClientRect").mockReturnValue(containerRect);
    container.scroll = vi.fn();

    const element = document.createElement("div");
    vi.spyOn(element, "getBoundingClientRect").mockReturnValue(
      new DOMRect(50, 60, 100, 40),
    );

    reveal(container, element, { behavior: "smooth" });
    expect(container.scroll).toHaveBeenCalledWith({
      behavior: "smooth",
      top: -40,
      left: undefined,
    });
  });
});

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
