import { describe, test, expect, beforeEach, vi, afterEach } from "vitest";

vi.hoisted(() => {
  vi.stubGlobal("CSS", {
    registerProperty: vi.fn(),
    supports: vi.fn((property: string) => property !== "anchor-name"),
  });
});

import AnchoredPopover from "../AnchoredPopover";

describe("AnchoredPopover", () => {
  let popover: AnchoredPopover;
  let button: HTMLElement;

  beforeEach(() => {
    popover = document.createElement("anchored-popover");
    popover.id = "popover";
    document.body.appendChild(popover);

    vi.spyOn(popover, "offsetWidth", "get").mockReturnValue(200);
    vi.spyOn(popover, "offsetHeight", "get").mockReturnValue(150);

    button = document.createElement("button");
    button.id = "button";
    button.setAttribute("popovertarget", popover.id);
    document.body.appendChild(button);

    vi.spyOn(window, "innerWidth", "get").mockReturnValue(1000);
    vi.spyOn(window, "innerHeight", "get").mockReturnValue(1000);
  });

  afterEach(() => {
    document.body.innerHTML = "";
  });

  test("should initialize the popover attribute", () => {
    expect(popover.popover).toBe("auto");
  });

  describe("anchorElement", () => {
    test("should return null before the popover is opened", () => {
      expect(popover.anchorElement).toBeNull();
    });

    test("should return the trigger element after the popover is opened", () => {
      popover.showPopover();
      expect(popover.anchorElement).toBe(button);
    });

    test("should return the element specified by anchor attribute", () => {
      popover.setAttribute("anchor", "button");
      expect(popover.anchorElement).toBe(button);
    });

    test("should return null if the anchor element does not exist", () => {
      popover.setAttribute("anchor", "non-existent");
      expect(popover.anchorElement).toBeNull();
    });
  });

  describe("toggle handling", () => {
    test("should update the aria-expanded attribute of the trigger on toggle", () => {
      popover.showPopover();
      expect(button.getAttribute("aria-expanded")).toBe("true");

      popover.hidePopover();
      expect(button.getAttribute("aria-expanded")).toBe("false");
    });
  });

  describe("trigger capture", () => {
    test("should capture the focused trigger element", () => {
      button.focus();
      popover.showPopover();

      expect(popover.anchorElement).toBe(button);
    });

    test("should support multiple triggers for one popover", () => {
      const button2 = document.createElement("button");
      button2.setAttribute("popovertarget", popover.id);
      document.body.appendChild(button2);

      vi.spyOn(button2, "getBoundingClientRect").mockReturnValue({
        top: 200,
        right: 300,
        bottom: 220,
        left: 200,
        width: 100,
        height: 20,
      } as DOMRect);

      button2.focus();
      popover.showPopover();

      expect(popover.anchorElement).toBe(button2);
      expect(button2.getAttribute("aria-expanded")).toBe("true");
      expect(button.getAttribute("aria-expanded")).toBeNull();
    });

    test("should clear the trigger element on close", () => {
      button.focus();
      popover.showPopover();

      expect(popover.anchorElement).toBe(button);

      popover.hidePopover();

      expect(popover.anchorElement).toBeNull();
    });
  });

  describe("position", () => {
    test("should appear below and left-aligned by default", async () => {
      vi.spyOn(button, "getBoundingClientRect").mockReturnValue({
        top: 100,
        right: 200,
        bottom: 120,
        left: 100,
        width: 100,
        height: 20,
      } as DOMRect);

      popover.showPopover();
      await new Promise((resolve) => requestAnimationFrame(resolve));

      expect(popover.style.inset).toBe("120px auto auto 100px");
      expect(popover.style.transformOrigin).toBe("left top");
    });

    test("should appear right-aligned when space is unavailable on the right", async () => {
      vi.spyOn(button, "getBoundingClientRect").mockReturnValue({
        top: 100,
        right: 950,
        bottom: 120,
        left: 850,
        width: 100,
        height: 20,
      } as DOMRect);

      popover.showPopover();
      await new Promise((resolve) => requestAnimationFrame(resolve));

      expect(popover.style.inset).toBe("120px 50px auto auto");
      expect(popover.style.transformOrigin).toBe("right top");
    });

    test("should appear above the anchor when space is unavailable below", async () => {
      vi.spyOn(button, "getBoundingClientRect").mockReturnValue({
        top: 970,
        right: 200,
        bottom: 990,
        left: 100,
        width: 100,
        height: 20,
      } as DOMRect);

      popover.showPopover();
      await new Promise((resolve) => requestAnimationFrame(resolve));

      expect(popover.style.inset).toBe("auto auto 30px 100px");
      expect(popover.style.transformOrigin).toBe("left bottom");
    });
  });
});
