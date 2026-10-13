import { beforeEach, describe, expect, test, vi } from "vitest";
import { reveal, scrollIntoViewIfNeeded, whenVisible } from "../scroll";
import IntersectionObserver from "@/test/mocks/IntersectionObserver";

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
    vi.spyOn(element, "getBoundingClientRect").mockReturnValue(new DOMRect(50, 150, 100, 40));

    reveal(container, element);
    expect(container.scroll).not.toHaveBeenCalled();
  });

  test("aligns top edge when element is above the container", () => {
    const container = document.createElement("div");
    vi.spyOn(container, "getBoundingClientRect").mockReturnValue(containerRect);
    container.scroll = vi.fn();

    const element = document.createElement("div");
    vi.spyOn(element, "getBoundingClientRect").mockReturnValue(new DOMRect(50, 60, 100, 40));

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
    vi.spyOn(element, "getBoundingClientRect").mockReturnValue(new DOMRect(50, 380, 100, 40));

    reveal(container, element);
    expect(container.scroll).toHaveBeenCalledWith({ top: 20, left: undefined });
  });

  test("aligns left edge when element is left of the container", () => {
    const container = document.createElement("div");
    vi.spyOn(container, "getBoundingClientRect").mockReturnValue(new DOMRect(100, 0, 400, 300));
    container.scroll = vi.fn();

    const element = document.createElement("div");
    vi.spyOn(element, "getBoundingClientRect").mockReturnValue(new DOMRect(60, 50, 40, 40));

    reveal(container, element);
    expect(container.scroll).toHaveBeenCalledWith({
      top: undefined,
      left: -40,
    });
  });

  test("aligns right edge when element is right of the container", () => {
    const container = document.createElement("div");
    vi.spyOn(container, "getBoundingClientRect").mockReturnValue(new DOMRect(100, 0, 400, 300));
    container.scroll = vi.fn();

    const element = document.createElement("div");
    vi.spyOn(element, "getBoundingClientRect").mockReturnValue(new DOMRect(480, 50, 40, 40));

    reveal(container, element);
    expect(container.scroll).toHaveBeenCalledWith({ top: undefined, left: 20 });
  });

  test("accounts for existing scroll position", () => {
    const container = document.createElement("div");
    vi.spyOn(container, "getBoundingClientRect").mockReturnValue(containerRect);
    Object.defineProperty(container, "scrollTop", { value: 200 });
    container.scroll = vi.fn();

    const element = document.createElement("div");
    vi.spyOn(element, "getBoundingClientRect").mockReturnValue(new DOMRect(50, 60, 100, 40));

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
    vi.spyOn(element, "getBoundingClientRect").mockReturnValue(new DOMRect(50, 60, 100, 40));

    reveal(container, element, { behavior: "smooth" });
    expect(container.scroll).toHaveBeenCalledWith({
      behavior: "smooth",
      top: -40,
      left: undefined,
    });
  });

  describe("scroll-padding and scroll-margin", () => {
    test("scroll-padding-top triggers scroll for element within padding zone", () => {
      const container = document.createElement("div");
      vi.spyOn(container, "getBoundingClientRect").mockReturnValue(containerRect);
      container.style.scrollPaddingTop = "20px";
      container.scroll = vi.fn();

      // Element top (115) is below container top (100) but within padding zone (100 + 20 = 120)
      const element = document.createElement("div");
      vi.spyOn(element, "getBoundingClientRect").mockReturnValue(new DOMRect(50, 115, 100, 40));

      reveal(container, element);
      expect(container.scroll).toHaveBeenCalledWith({
        top: -5,
        left: undefined,
      });
    });

    test("scroll-margin-top triggers scroll for element within margin zone", () => {
      const container = document.createElement("div");
      vi.spyOn(container, "getBoundingClientRect").mockReturnValue(containerRect);
      container.scroll = vi.fn();

      // Element top (115) is below container top (100) but within margin zone (100 + 20 = 120)
      const element = document.createElement("div");
      vi.spyOn(element, "getBoundingClientRect").mockReturnValue(new DOMRect(50, 115, 100, 40));
      element.style.scrollMarginTop = "20px";

      reveal(container, element);
      expect(container.scroll).toHaveBeenCalledWith({
        top: -5,
        left: undefined,
      });
    });

    test("scroll-padding-bottom triggers scroll for element within padding zone", () => {
      const container = document.createElement("div");
      vi.spyOn(container, "getBoundingClientRect").mockReturnValue(containerRect);
      container.style.scrollPaddingBottom = "20px";
      container.scroll = vi.fn();

      // Element bottom (390) is above container bottom (400) but within padding zone (400 - 20 = 380)
      const element = document.createElement("div");
      vi.spyOn(element, "getBoundingClientRect").mockReturnValue(new DOMRect(50, 370, 100, 20));

      reveal(container, element);
      expect(container.scroll).toHaveBeenCalledWith({
        top: 10,
        left: undefined,
      });
    });

    test("scroll-padding-left triggers scroll for element within padding zone", () => {
      const container = document.createElement("div");
      vi.spyOn(container, "getBoundingClientRect").mockReturnValue(new DOMRect(100, 0, 400, 300));
      container.style.scrollPaddingLeft = "20px";
      container.scroll = vi.fn();

      // Element left (115) is right of container left (100) but within padding zone (100 + 20 = 120)
      const element = document.createElement("div");
      vi.spyOn(element, "getBoundingClientRect").mockReturnValue(new DOMRect(115, 50, 40, 40));

      reveal(container, element);
      expect(container.scroll).toHaveBeenCalledWith({
        top: undefined,
        left: -5,
      });
    });

    test("scroll-padding-right triggers scroll for element within padding zone", () => {
      const container = document.createElement("div");
      vi.spyOn(container, "getBoundingClientRect").mockReturnValue(new DOMRect(100, 0, 400, 300));
      container.style.scrollPaddingRight = "20px";
      container.scroll = vi.fn();

      // Element right (490) is left of container right (500) but within padding zone (500 - 20 = 480)
      const element = document.createElement("div");
      vi.spyOn(element, "getBoundingClientRect").mockReturnValue(new DOMRect(450, 50, 40, 40));

      reveal(container, element);
      expect(container.scroll).toHaveBeenCalledWith({
        top: undefined,
        left: 10,
      });
    });

    test("combines scroll-padding and scroll-margin", () => {
      const container = document.createElement("div");
      vi.spyOn(container, "getBoundingClientRect").mockReturnValue(containerRect);
      container.style.scrollPaddingTop = "15px";
      container.scroll = vi.fn();

      // Element top (125) is below container top (100) but within combined zone (100 + 15 + 15 = 130)
      const element = document.createElement("div");
      vi.spyOn(element, "getBoundingClientRect").mockReturnValue(new DOMRect(50, 125, 100, 40));
      element.style.scrollMarginTop = "15px";

      reveal(container, element);
      expect(container.scroll).toHaveBeenCalledWith({
        top: -5,
        left: undefined,
      });
    });

    test("does not scroll when element is visible outside padding zone", () => {
      const container = document.createElement("div");
      vi.spyOn(container, "getBoundingClientRect").mockReturnValue(containerRect);
      container.style.scrollPaddingTop = "20px";
      container.scroll = vi.fn();

      // Element top (130) is below the padding zone (100 + 20 = 120)
      const element = document.createElement("div");
      vi.spyOn(element, "getBoundingClientRect").mockReturnValue(new DOMRect(50, 130, 100, 40));

      reveal(container, element);
      expect(container.scroll).not.toHaveBeenCalled();
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
    vi.spyOn(element, "getBoundingClientRect").mockReturnValue(new DOMRect(0, -150, 100, 100));
    const scrollIntoView = vi.spyOn(element, "scrollIntoView");
    scrollIntoViewIfNeeded(element, options);
    expect(scrollIntoView).toHaveBeenCalledWith(options);
  });

  test("scrolls the element into view if it is clipped by the bottom of the viewport", () => {
    const element = document.createElement("div");
    vi.spyOn(element, "getBoundingClientRect").mockReturnValue(new DOMRect(0, 650, 100, 100));
    const scrollIntoView = vi.spyOn(element, "scrollIntoView");
    scrollIntoViewIfNeeded(element, options);
    expect(scrollIntoView).toHaveBeenCalledWith(options);
  });

  test("scrolls the element into view if it is clipped by the left of the viewport", () => {
    const element = document.createElement("div");
    vi.spyOn(element, "getBoundingClientRect").mockReturnValue(new DOMRect(-150, 0, 100, 100));
    const scrollIntoView = vi.spyOn(element, "scrollIntoView");
    scrollIntoViewIfNeeded(element, options);
    expect(scrollIntoView).toHaveBeenCalledWith(options);
  });

  test("scrolls the element into view if it is clipped by the right of the viewport", () => {
    const element = document.createElement("div");
    vi.spyOn(element, "getBoundingClientRect").mockReturnValue(new DOMRect(0, 850, 100, 100));
    const scrollIntoView = vi.spyOn(element, "scrollIntoView");
    scrollIntoViewIfNeeded(element, options);
    expect(scrollIntoView).toHaveBeenCalledWith(options);
  });

  test("does not scroll the element if it is fully visible", () => {
    const element = document.createElement("div");
    vi.spyOn(element, "getBoundingClientRect").mockReturnValue(new DOMRect(0, 50, 100, 100));
    const scrollIntoView = vi.spyOn(element, "scrollIntoView");
    scrollIntoViewIfNeeded(element, options);
    expect(scrollIntoView).not.toHaveBeenCalled();
  });
});

function getLastObserver() {
  const observer = IntersectionObserver.instances.at(-1);
  if (!observer) {
    throw new Error("no IntersectionObserver was created");
  }
  return observer;
}

describe("whenVisible", () => {
  beforeEach(() => {
    IntersectionObserver.instances = [];
  });

  test("resolves and disconnects once the element intersects", async () => {
    const element = document.createElement("div");
    const promise = whenVisible(element, {
      signal: new AbortController().signal,
    });

    const observer = getLastObserver();
    expect(observer.observe).toHaveBeenCalledWith(element);

    observer.trigger(true);

    await expect(promise).resolves.toBeUndefined();
    expect(observer.disconnect).toHaveBeenCalled();
  });

  test("ignores entries that are not intersecting", async () => {
    let resolved = false;
    const promise = whenVisible(document.createElement("div"), {
      signal: new AbortController().signal,
    }).then(() => {
      resolved = true;
    });

    getLastObserver().trigger(false);
    await Promise.resolve();
    expect(resolved).toBe(false);

    getLastObserver().trigger(true);
    await promise;
    expect(resolved).toBe(true);
  });

  test("rejects with the abort reason and disconnects", async () => {
    const controller = new AbortController();
    const reason = new Error("aborted");
    const promise = whenVisible(document.createElement("div"), {
      signal: controller.signal,
    });

    controller.abort(reason);

    await expect(promise).rejects.toBe(reason);
    expect(getLastObserver().disconnect).toHaveBeenCalled();
  });

  test("rejects immediately when the signal is already aborted", async () => {
    const controller = new AbortController();
    const reason = new Error("already aborted");
    controller.abort(reason);

    await expect(
      whenVisible(document.createElement("div"), { signal: controller.signal }),
    ).rejects.toBe(reason);
    expect(IntersectionObserver.instances).toHaveLength(0);
  });

  test("forwards observer options and omits the signal", () => {
    void whenVisible(document.createElement("div"), {
      signal: new AbortController().signal,
      rootMargin: "-80px",
      threshold: 0.5,
    });

    expect(getLastObserver().options).toEqual({
      rootMargin: "-80px",
      threshold: 0.5,
    });
  });
});
