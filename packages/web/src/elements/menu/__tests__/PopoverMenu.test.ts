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
  let items: HTMLButtonElement[];

  beforeEach(() => {
    menu = document.createElement("popover-menu") as PopoverMenu;
    menu.id = "menu";

    items = Array.from({ length: 3 }, (_, i) => {
      const item = document.createElement("button");
      item.className = "menuitem";
      item.role = "menuitem";
      item.textContent = `Item ${i + 1}`;
      menu.appendChild(item);
      return item;
    });

    document.body.appendChild(menu);

    button = document.createElement("button");
    button.id = "button";
    button.setAttribute("popovertarget", menu.id);
    document.body.appendChild(button);
  });

  afterEach(() => {
    document.body.innerHTML = "";
    vi.restoreAllMocks();
  });

  describe("keyboard navigation", () => {
    it("should focus the first menu item on open", () => {
      menu.showPopover();

      expect(document.activeElement).toBe(items[0]);
    });

    it("should navigate down with ArrowDown", () => {
      items[0]!.tabIndex = 0;
      items[0]!.focus();

      items[0]!.dispatchEvent(
        new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true }),
      );

      expect(document.activeElement).toBe(items[1]);
    });

    it("should navigate up with ArrowUp", () => {
      items[1]!.tabIndex = 0;
      items[1]!.focus();

      items[1]!.dispatchEvent(
        new KeyboardEvent("keydown", { key: "ArrowUp", bubbles: true }),
      );

      expect(document.activeElement).toBe(items[0]);
    });

    it("should wrap from last to first with ArrowDown", () => {
      items[2]!.tabIndex = 0;
      items[2]!.focus();

      items[2]!.dispatchEvent(
        new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true }),
      );

      expect(document.activeElement).toBe(items[0]);
    });

    it("should wrap from first to last with ArrowUp", () => {
      items[0]!.tabIndex = 0;
      items[0]!.focus();

      items[0]!.dispatchEvent(
        new KeyboardEvent("keydown", { key: "ArrowUp", bubbles: true }),
      );

      expect(document.activeElement).toBe(items[2]);
    });

    it("should jump to the first item with Home", () => {
      items[2]!.tabIndex = 0;
      items[2]!.focus();

      items[2]!.dispatchEvent(
        new KeyboardEvent("keydown", { key: "Home", bubbles: true }),
      );

      expect(document.activeElement).toBe(items[0]);
    });

    it("should jump to the last item with End", () => {
      items[0]!.tabIndex = 0;
      items[0]!.focus();

      items[0]!.dispatchEvent(
        new KeyboardEvent("keydown", { key: "End", bubbles: true }),
      );

      expect(document.activeElement).toBe(items[2]);
    });

    it("should not navigate with ArrowLeft or ArrowRight", () => {
      items[0]!.tabIndex = 0;
      items[0]!.focus();

      items[0]!.dispatchEvent(
        new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }),
      );

      expect(document.activeElement).toBe(items[0]);
    });
  });
});
