import { afterEach, describe, expect, test, vi } from "vitest";
import KeyboardNavigation from "../keyboard";

function createToolbar(count: number) {
  const container = document.createElement("div");
  for (let i = 0; i < count; i++) {
    const button = document.createElement("button");
    button.className = "item";
    button.textContent = `Item ${i}`;
    container.append(button);
  }
  document.body.append(container);
  return container;
}

function press(target: Element, key: string) {
  const event = new KeyboardEvent("keydown", { key, bubbles: true });
  vi.spyOn(event, "preventDefault");
  target.dispatchEvent(event);
  return event;
}

afterEach(() => document.body.replaceChildren());

describe("KeyboardNavigation", () => {
  describe("update", () => {
    test("sets tabindex=0 on first item and -1 on others", () => {
      const container = createToolbar(3);
      const nav = new KeyboardNavigation(container, { selector: ".item" });
      nav.update();

      const items = container.querySelectorAll(".item");
      expect(items[0]?.getAttribute("tabindex")).toBe("0");
      expect(items[1]?.getAttribute("tabindex")).toBe("-1");
      expect(items[2]?.getAttribute("tabindex")).toBe("-1");
    });

    test("preserves current active item if still present", () => {
      const container = createToolbar(3);
      const nav = new KeyboardNavigation(container, { selector: ".item" });
      const items = container.querySelectorAll<HTMLElement>(".item");

      // Manually set second item active
      items[0]!.tabIndex = -1;
      items[1]!.tabIndex = 0;
      items[2]!.tabIndex = -1;

      nav.update();

      expect(items[0]?.getAttribute("tabindex")).toBe("-1");
      expect(items[1]?.getAttribute("tabindex")).toBe("0");
      expect(items[2]?.getAttribute("tabindex")).toBe("-1");
    });

    test("falls back to first item when active item is removed", () => {
      const container = createToolbar(3);
      const nav = new KeyboardNavigation(container, { selector: ".item" });
      const items = container.querySelectorAll<HTMLElement>(".item");

      items[1]!.tabIndex = 0;
      items[1]!.remove();

      nav.update();

      const remaining = container.querySelectorAll(".item");
      expect(remaining[0]?.getAttribute("tabindex")).toBe("0");
      expect(remaining[1]?.getAttribute("tabindex")).toBe("-1");
    });

    test("handles empty container", () => {
      const container = document.createElement("div");
      document.body.append(container);
      const nav = new KeyboardNavigation(container, { selector: ".item" });
      expect(() => nav.update()).not.toThrow();
    });
  });

  describe("activeItem", () => {
    test("returns the item with tabindex=0", () => {
      const container = createToolbar(3);
      const nav = new KeyboardNavigation(container, { selector: ".item" });
      nav.update();

      expect(nav.activeItem).toBe(container.querySelector(".item"));
    });

    test("returns null when no item has tabindex=0", () => {
      const container = createToolbar(3);
      const nav = new KeyboardNavigation(container, { selector: ".item" });
      expect(nav.activeItem).toBeNull();
    });
  });

  describe("setActiveItem", () => {
    test("updates tabindex on all items", () => {
      const container = createToolbar(3);
      const nav = new KeyboardNavigation(container, { selector: ".item" });
      const items = container.querySelectorAll<HTMLElement>(".item");

      nav.setActiveItem(items[2]!);

      expect(items[0]?.getAttribute("tabindex")).toBe("-1");
      expect(items[1]?.getAttribute("tabindex")).toBe("-1");
      expect(items[2]?.getAttribute("tabindex")).toBe("0");
    });

    test("does not focus by default", () => {
      const container = createToolbar(3);
      const nav = new KeyboardNavigation(container, { selector: ".item" });
      const items = container.querySelectorAll<HTMLElement>(".item");
      const spy = vi.spyOn(items[1]!, "focus");

      nav.setActiveItem(items[1]!);

      expect(spy).not.toHaveBeenCalled();
    });

    test("focuses the item when focus=true", () => {
      const container = createToolbar(3);
      const nav = new KeyboardNavigation(container, { selector: ".item" });
      const items = container.querySelectorAll<HTMLElement>(".item");
      const spy = vi.spyOn(items[1]!, "focus");

      nav.setActiveItem(items[1]!, true);

      expect(spy).toHaveBeenCalledTimes(1);
    });

    test("calls onFocus callback when focus=true", () => {
      const onFocus = vi.fn();
      const container = createToolbar(3);
      const nav = new KeyboardNavigation(container, {
        selector: ".item",
        onFocus,
      });
      const items = container.querySelectorAll<HTMLElement>(".item");

      nav.setActiveItem(items[1]!, true);

      expect(onFocus).toHaveBeenCalledWith(items[1]);
    });

    test("does not call onFocus callback when focus=false", () => {
      const onFocus = vi.fn();
      const container = createToolbar(3);
      const nav = new KeyboardNavigation(container, {
        selector: ".item",
        onFocus,
      });
      const items = container.querySelectorAll<HTMLElement>(".item");

      nav.setActiveItem(items[1]!);

      expect(onFocus).not.toHaveBeenCalled();
    });

    test("sets all items to tabindex=-1 when item is null", () => {
      const container = createToolbar(3);
      const nav = new KeyboardNavigation(container, { selector: ".item" });

      nav.setActiveItem(null);

      const items = container.querySelectorAll(".item");
      expect(items[0]?.getAttribute("tabindex")).toBe("-1");
      expect(items[1]?.getAttribute("tabindex")).toBe("-1");
      expect(items[2]?.getAttribute("tabindex")).toBe("-1");
    });
  });

  describe("focusFirst", () => {
    test("focuses the first item", () => {
      const container = createToolbar(3);
      const nav = new KeyboardNavigation(container, { selector: ".item" });
      const items = container.querySelectorAll<HTMLElement>(".item");

      nav.focusFirst();

      expect(nav.activeItem).toBe(items[0]);
      expect(document.activeElement).toBe(items[0]);
    });

    test("sets tabindex on all items", () => {
      const container = createToolbar(3);
      const nav = new KeyboardNavigation(container, { selector: ".item" });
      const items = container.querySelectorAll(".item");

      nav.focusFirst();

      expect(items[0]?.getAttribute("tabindex")).toBe("0");
      expect(items[1]?.getAttribute("tabindex")).toBe("-1");
      expect(items[2]?.getAttribute("tabindex")).toBe("-1");
    });

    test("does nothing when there are no items", () => {
      const container = document.createElement("div");
      document.body.append(container);
      const nav = new KeyboardNavigation(container, { selector: ".item" });

      nav.focusFirst();

      expect(nav.activeItem).toBeNull();
    });
  });

  describe("horizontal navigation", () => {
    test("ArrowRight moves to next item", () => {
      const container = createToolbar(3);
      const nav = new KeyboardNavigation(container, { selector: ".item" });
      nav.attach();
      nav.update();

      const items = container.querySelectorAll<HTMLElement>(".item");
      items[0]!.focus();
      press(items[0]!, "ArrowRight");

      expect(nav.activeItem).toBe(items[1]);
    });

    test("ArrowLeft moves to previous item", () => {
      const container = createToolbar(3);
      const nav = new KeyboardNavigation(container, { selector: ".item" });
      nav.attach();
      nav.setActiveItem(container.querySelectorAll<HTMLElement>(".item")[1]!);

      const items = container.querySelectorAll<HTMLElement>(".item");
      items[1]!.focus();
      press(items[1]!, "ArrowLeft");

      expect(nav.activeItem).toBe(items[0]);
    });

    test("wraps from last to first", () => {
      const container = createToolbar(3);
      const nav = new KeyboardNavigation(container, { selector: ".item" });
      nav.attach();

      const items = container.querySelectorAll<HTMLElement>(".item");
      nav.setActiveItem(items[2]!);
      items[2]!.focus();
      press(items[2]!, "ArrowRight");

      expect(nav.activeItem).toBe(items[0]);
    });

    test("wraps from first to last", () => {
      const container = createToolbar(3);
      const nav = new KeyboardNavigation(container, { selector: ".item" });
      nav.attach();
      nav.update();

      const items = container.querySelectorAll<HTMLElement>(".item");
      items[0]!.focus();
      press(items[0]!, "ArrowLeft");

      expect(nav.activeItem).toBe(items[2]);
    });

    test("does not wrap when wrap=false", () => {
      const container = createToolbar(3);
      const nav = new KeyboardNavigation(container, {
        selector: ".item",
        wrap: false,
      });
      nav.attach();
      nav.update();

      const items = container.querySelectorAll<HTMLElement>(".item");
      items[0]!.focus();
      press(items[0]!, "ArrowLeft");

      expect(nav.activeItem).toBe(items[0]);
    });

    test("ignores ArrowUp and ArrowDown", () => {
      const container = createToolbar(3);
      const nav = new KeyboardNavigation(container, { selector: ".item" });
      nav.attach();
      nav.update();

      const items = container.querySelectorAll<HTMLElement>(".item");
      items[0]!.focus();
      const event = press(items[0]!, "ArrowDown");

      expect(nav.activeItem).toBe(items[0]);
      expect(event.preventDefault).not.toHaveBeenCalled();
    });
  });

  describe("vertical navigation", () => {
    test("ArrowDown moves to next item", () => {
      const container = createToolbar(3);
      const nav = new KeyboardNavigation(container, {
        selector: ".item",
        orientation: "vertical",
      });
      nav.attach();
      nav.update();

      const items = container.querySelectorAll<HTMLElement>(".item");
      items[0]!.focus();
      press(items[0]!, "ArrowDown");

      expect(nav.activeItem).toBe(items[1]);
    });

    test("ArrowUp moves to previous item", () => {
      const container = createToolbar(3);
      const nav = new KeyboardNavigation(container, {
        selector: ".item",
        orientation: "vertical",
      });
      nav.attach();

      const items = container.querySelectorAll<HTMLElement>(".item");
      nav.setActiveItem(items[1]!);
      items[1]!.focus();
      press(items[1]!, "ArrowUp");

      expect(nav.activeItem).toBe(items[0]);
    });

    test("ignores ArrowLeft and ArrowRight", () => {
      const container = createToolbar(3);
      const nav = new KeyboardNavigation(container, {
        selector: ".item",
        orientation: "vertical",
      });
      nav.attach();
      nav.update();

      const items = container.querySelectorAll<HTMLElement>(".item");
      items[0]!.focus();
      const event = press(items[0]!, "ArrowRight");

      expect(nav.activeItem).toBe(items[0]);
      expect(event.preventDefault).not.toHaveBeenCalled();
    });
  });

  describe("both orientation", () => {
    test("responds to all arrow keys", () => {
      const container = createToolbar(3);
      const nav = new KeyboardNavigation(container, {
        selector: ".item",
        orientation: "both",
      });
      nav.attach();
      nav.update();

      const items = container.querySelectorAll<HTMLElement>(".item");

      items[0]!.focus();
      press(items[0]!, "ArrowRight");
      expect(nav.activeItem).toBe(items[1]);

      items[1]!.focus();
      press(items[1]!, "ArrowDown");
      expect(nav.activeItem).toBe(items[2]);

      items[2]!.focus();
      press(items[2]!, "ArrowLeft");
      expect(nav.activeItem).toBe(items[1]);

      items[1]!.focus();
      press(items[1]!, "ArrowUp");
      expect(nav.activeItem).toBe(items[0]);
    });
  });

  describe("Home and End", () => {
    test("Home moves to first item", () => {
      const container = createToolbar(3);
      const nav = new KeyboardNavigation(container, { selector: ".item" });
      nav.attach();

      const items = container.querySelectorAll<HTMLElement>(".item");
      nav.setActiveItem(items[2]!);
      items[2]!.focus();
      press(items[2]!, "Home");

      expect(nav.activeItem).toBe(items[0]);
    });

    test("End moves to last item", () => {
      const container = createToolbar(3);
      const nav = new KeyboardNavigation(container, { selector: ".item" });
      nav.attach();
      nav.update();

      const items = container.querySelectorAll<HTMLElement>(".item");
      items[0]!.focus();
      press(items[0]!, "End");

      expect(nav.activeItem).toBe(items[2]);
    });
  });

  describe("event handling", () => {
    test("calls preventDefault on handled keys", () => {
      const container = createToolbar(3);
      const nav = new KeyboardNavigation(container, { selector: ".item" });
      nav.attach();
      nav.update();

      const items = container.querySelectorAll<HTMLElement>(".item");
      items[0]!.focus();
      const event = press(items[0]!, "ArrowRight");

      expect(event.preventDefault).toHaveBeenCalledTimes(1);
    });

    test("does not call preventDefault on unhandled keys", () => {
      const container = createToolbar(3);
      const nav = new KeyboardNavigation(container, { selector: ".item" });
      nav.attach();
      nav.update();

      const items = container.querySelectorAll<HTMLElement>(".item");
      items[0]!.focus();
      const event = press(items[0]!, "Enter");

      expect(event.preventDefault).not.toHaveBeenCalled();
    });

    test("falls back to active item when event target doesn't match selector", () => {
      const container = createToolbar(3);
      const items = container.querySelectorAll(".item");
      const other = document.createElement("span");
      container.append(other);

      const nav = new KeyboardNavigation(container, { selector: ".item" });
      nav.attach();
      nav.update();

      press(other, "ArrowRight");

      expect(document.activeElement).toBe(items[1]);
    });

    test("ignores events when no active item and target doesn't match selector", () => {
      const container = createToolbar(3);
      const other = document.createElement("span");
      container.append(other);

      const nav = new KeyboardNavigation(container, { selector: ".item" });
      nav.attach();

      const event = press(other, "ArrowRight");

      expect(event.preventDefault).not.toHaveBeenCalled();
    });

    test("handles events from child elements of items", () => {
      const container = document.createElement("div");
      const button = document.createElement("button");
      button.className = "item";
      const icon = document.createElement("svg");
      button.append(icon);
      container.append(button);

      const button2 = document.createElement("button");
      button2.className = "item";
      container.append(button2);

      document.body.append(container);

      const nav = new KeyboardNavigation(container, { selector: ".item" });
      nav.attach();
      nav.update();

      // Dispatch from the SVG child, should still navigate
      press(icon, "ArrowRight");

      expect(nav.activeItem).toBe(button2);
    });

    test("does not handle events when detached", () => {
      const container = createToolbar(3);
      const nav = new KeyboardNavigation(container, { selector: ".item" });
      nav.attach();
      nav.update();
      nav.detach();

      const items = container.querySelectorAll<HTMLElement>(".item");
      items[0]!.focus();
      press(items[0]!, "ArrowRight");

      expect(nav.activeItem).toBe(items[0]);
    });

    test("can re-attach after detaching", () => {
      const container = createToolbar(3);
      const nav = new KeyboardNavigation(container, { selector: ".item" });
      nav.attach();
      nav.update();
      nav.detach();
      nav.attach();

      const items = container.querySelectorAll<HTMLElement>(".item");
      items[0]!.focus();
      press(items[0]!, "ArrowRight");

      expect(nav.activeItem).toBe(items[1]);
    });
  });

  describe("onFocus callback", () => {
    test("called on keyboard navigation", () => {
      const onFocus = vi.fn();
      const container = createToolbar(3);
      const nav = new KeyboardNavigation(container, {
        selector: ".item",
        onFocus,
      });
      nav.attach();
      nav.update();

      const items = container.querySelectorAll<HTMLElement>(".item");
      items[0]!.focus();
      press(items[0]!, "ArrowRight");

      expect(onFocus).toHaveBeenCalledWith(items[1]);
    });
  });
});
