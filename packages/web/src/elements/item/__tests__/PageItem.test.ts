import { afterEach, describe, expect, test } from "vitest";
import "@/elements/item/PageItem";
import type PageItem from "@/elements/item/PageItem";

function createItem(attributes: Record<string, string>): PageItem {
  const item = document.createElement("page-item");
  for (const [name, value] of Object.entries(attributes)) {
    item.setAttribute(name, value);
  }
  document.body.append(item);
  return item;
}

function handleOf(item: PageItem) {
  return item.shadowRoot?.querySelector("item-handle") ?? null;
}

afterEach(() => {
  document.body.replaceChildren();
});

describe("PageItem", () => {
  describe("handle", () => {
    test("shows the handle while a highlighted item is selected", () => {
      const item = createItem({ highlight: "", "aria-selected": "true" });

      const handle = handleOf(item);
      expect(handle).not.toBeNull();
      expect(handle?.allowDrag).toBe(false);
      expect(handle?.resize).toBeNull();
    });

    test("removes the handle when a highlighted item is deselected", () => {
      const item = createItem({ highlight: "", "aria-selected": "true" });

      item.setAttribute("aria-selected", "false");

      expect(handleOf(item)).toBeNull();
    });

    test("shows no handle for a selected item that cannot be highlighted, dragged or resized", () => {
      const item = createItem({ "aria-selected": "true" });

      expect(handleOf(item)).toBeNull();
    });

    test("enables dragging on the handle of a selected draggable item", () => {
      const item = createItem({ allowdrag: "", "aria-selected": "true" });

      expect(handleOf(item)?.allowDrag).toBe(true);
    });

    test("adds resize handles to a selected resizable item", () => {
      const item = createItem({ resize: "all", "aria-selected": "true" });

      expect(handleOf(item)?.resize).toBe("all");
    });
  });
});
