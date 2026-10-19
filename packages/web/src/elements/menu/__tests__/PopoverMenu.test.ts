import { describe, test, expect, beforeEach, vi, afterEach } from "vitest";

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
    menu = document.createElement("popover-menu");
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
  });

  describe("keyboard navigation", () => {
    test("should focus the first menu item on open", () => {
      menu.showPopover();

      expect(document.activeElement).toBe(items[0]);
    });

    test("should navigate down with ArrowDown", () => {
      items[0]!.tabIndex = 0;
      items[0]!.focus();

      items[0]!.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true }));

      expect(document.activeElement).toBe(items[1]);
    });

    test("should navigate up with ArrowUp", () => {
      items[1]!.tabIndex = 0;
      items[1]!.focus();

      items[1]!.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowUp", bubbles: true }));

      expect(document.activeElement).toBe(items[0]);
    });

    test("should wrap from last to first with ArrowDown", () => {
      items[2]!.tabIndex = 0;
      items[2]!.focus();

      items[2]!.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true }));

      expect(document.activeElement).toBe(items[0]);
    });

    test("should wrap from first to last with ArrowUp", () => {
      items[0]!.tabIndex = 0;
      items[0]!.focus();

      items[0]!.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowUp", bubbles: true }));

      expect(document.activeElement).toBe(items[2]);
    });

    test("should jump to the first item with Home", () => {
      items[2]!.tabIndex = 0;
      items[2]!.focus();

      items[2]!.dispatchEvent(new KeyboardEvent("keydown", { key: "Home", bubbles: true }));

      expect(document.activeElement).toBe(items[0]);
    });

    test("should jump to the last item with End", () => {
      items[0]!.tabIndex = 0;
      items[0]!.focus();

      items[0]!.dispatchEvent(new KeyboardEvent("keydown", { key: "End", bubbles: true }));

      expect(document.activeElement).toBe(items[2]);
    });

    test("should not navigate with ArrowLeft or ArrowRight", () => {
      items[0]!.tabIndex = 0;
      items[0]!.focus();

      items[0]!.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));

      expect(document.activeElement).toBe(items[0]);
    });
  });

  describe("activation", () => {
    test("should close when a menu item is clicked", () => {
      menu.showPopover();

      items[1]!.click();

      expect(menu.hasAttribute("open")).toBe(false);
    });

    test("should stay open when a checkbox item is clicked", () => {
      const checkbox = document.createElement("button");
      checkbox.role = "menuitemcheckbox";
      menu.appendChild(checkbox);
      menu.showPopover();

      checkbox.click();

      expect(menu.hasAttribute("open")).toBe(true);
    });

    test("should stay open when a radio item is clicked", () => {
      const radio = document.createElement("button");
      radio.role = "menuitemradio";
      menu.appendChild(radio);
      menu.showPopover();

      radio.click();

      expect(menu.hasAttribute("open")).toBe(true);
    });

    test("should run the item's own click handler before closing", () => {
      const order: string[] = [];
      items[0]!.addEventListener("click", () => order.push("item"));
      menu.addEventListener("toggle", () => order.push("toggle"));
      menu.showPopover();
      order.length = 0;

      items[0]!.click();

      expect(order).toEqual(["item", "toggle"]);
    });
  });
});
