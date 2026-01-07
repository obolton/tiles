import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";

vi.hoisted(() => {
  vi.stubGlobal("CSS", {
    registerProperty: vi.fn(),
    supports: vi.fn((property: string) => property !== "anchor-name"),
  });
});

import PopoverMenu from "../PopoverMenu";

describe("PopoverMenu", () => {
  let menu: PopoverMenu;
  let button: HTMLElement;

  beforeEach(() => {
    menu = document.createElement("popover-menu") as PopoverMenu;
    menu.id = "menu";
    document.body.appendChild(menu);

    vi.spyOn(menu, "offsetWidth", "get").mockReturnValue(200);
    vi.spyOn(menu, "offsetHeight", "get").mockReturnValue(150);

    button = document.createElement("button");
    button.id = "button";
    button.setAttribute("popovertarget", menu.id);
    document.body.appendChild(button);

    vi.spyOn(window, "innerWidth", "get").mockReturnValue(1000);
    vi.spyOn(window, "innerHeight", "get").mockReturnValue(1000);
  });

  afterEach(() => {
    document.body.innerHTML = "";
    vi.restoreAllMocks();
  });

  it("should initialize the popover attribute", () => {
    expect(menu.popover).toBe("auto");
  });

  describe("anchorElement", () => {
    it("should return null before the popover is opened", () => {
      expect(menu.anchorElement).toBeNull();
    });

    it("should return the trigger element after the popover is opened", () => {
      menu.showPopover();
      expect(menu.anchorElement).toBe(button);
    });

    it("should return the element specified by anchor attribute", () => {
      menu.setAttribute("anchor", "button");
      expect(menu.anchorElement).toBe(button);
    });

    it("should return null if the anchor element does not exist", () => {
      menu.setAttribute("anchor", "non-existent");
      expect(menu.anchorElement).toBeNull();
    });
  });

  describe("toggle handling", () => {
    it("should update the aria-expanded attribute of the trigger on toggle", () => {
      menu.showPopover();
      expect(button.getAttribute("aria-expanded")).toBe("true");

      menu.hidePopover();
      expect(button.getAttribute("aria-expanded")).toBe("false");
    });
  });

  describe("trigger capture", () => {
    it("should capture the focused trigger element", () => {
      button.focus();
      menu.showPopover();

      expect(menu.anchorElement).toBe(button);
    });

    it("should support multiple triggers for one popover", () => {
      const button2 = document.createElement("button");
      button2.setAttribute("popovertarget", menu.id);
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
      menu.showPopover();

      expect(menu.anchorElement).toBe(button2);
      expect(button2.getAttribute("aria-expanded")).toBe("true");
      expect(button.getAttribute("aria-expanded")).toBeNull();
    });

    it("should clear the trigger element on close", () => {
      button.focus();
      menu.showPopover();

      expect(menu.anchorElement).toBe(button);

      menu.hidePopover();

      expect(menu.anchorElement).toBeNull();
    });
  });

  describe("position", () => {
    it("should appear below and left-aligned by default", async () => {
      vi.spyOn(button, "getBoundingClientRect").mockReturnValue({
        top: 100,
        right: 200,
        bottom: 120,
        left: 100,
        width: 100,
        height: 20,
      } as DOMRect);

      menu.showPopover();
      await new Promise((resolve) => requestAnimationFrame(resolve));

      expect(menu.style.inset).toBe("120px auto auto 100px");
      expect(menu.style.transformOrigin).toBe("left top");
    });

    it("should appear right-aligned when space is unavailable on the right", async () => {
      vi.spyOn(button, "getBoundingClientRect").mockReturnValue({
        top: 100,
        right: 950,
        bottom: 120,
        left: 850,
        width: 100,
        height: 20,
      } as DOMRect);

      menu.showPopover();
      await new Promise((resolve) => requestAnimationFrame(resolve));

      expect(menu.style.inset).toBe("120px 50px auto auto");
      expect(menu.style.transformOrigin).toBe("right top");
    });

    it("should appear above the anchor when space is unavailable below", async () => {
      vi.spyOn(button, "getBoundingClientRect").mockReturnValue({
        top: 970,
        right: 200,
        bottom: 990,
        left: 100,
        width: 100,
        height: 20,
      } as DOMRect);

      menu.showPopover();
      await new Promise((resolve) => requestAnimationFrame(resolve));

      expect(menu.style.inset).toBe("auto auto 30px 100px");
      expect(menu.style.transformOrigin).toBe("left bottom");
    });
  });
});
