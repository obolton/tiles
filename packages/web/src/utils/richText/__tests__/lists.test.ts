import { describe, expect, test } from "vitest";
import { lists } from "../lists";
import { checkList, createState, doc, li, p, withView } from "./builders";
import type { EditorView } from "prosemirror-view";

function checkedItems(view: EditorView) {
  const items: boolean[] = [];
  view.state.doc.descendants((node) => {
    if (node.type.name === "list_item") {
      items.push(node.attrs.checked as boolean);
    }
  });
  return items;
}

interface Items {
  done: HTMLLIElement;
  todo: HTMLLIElement;
}

function withCheckList<T>(callback: (view: EditorView, items: Items) => T) {
  const content = doc(
    checkList(li(p("Done"), { checked: true }), li(p("Todo"), { checked: false })),
  );
  return withView(createState(content, 3, [lists()]), (view) => {
    const [done, todo] = view.dom.querySelectorAll("li");
    if (!done || !todo) {
      throw new Error("Expected two list items");
    }
    return callback(view, { done, todo });
  });
}

describe("lists", () => {
  test("renders list items as checkboxes reflecting the checked attribute", () => {
    withCheckList((_, { done, todo }) => {
      expect(done.getAttribute("role")).toBe("checkbox");
      expect(done.getAttribute("aria-checked")).toBe("true");
      expect(todo.getAttribute("role")).toBe("checkbox");
      expect(todo.getAttribute("aria-checked")).toBe("false");
    });
  });

  test("clicking an item toggles its checked attribute and updates the DOM", () => {
    withCheckList((view, { done, todo }) => {
      todo.click();
      expect(checkedItems(view)).toEqual([true, true]);
      expect(todo.getAttribute("aria-checked")).toBe("true");

      done.click();
      expect(checkedItems(view)).toEqual([false, true]);
      expect(done.getAttribute("aria-checked")).toBe("false");
    });
  });

  test("the click is marked as handled", () => {
    withCheckList((_, { done }) => {
      const event = new MouseEvent("click", { bubbles: true, cancelable: true });
      done.dispatchEvent(event);
      expect(event.defaultPrevented).toBe(true);
    });
  });

  test("ignores clicks on the item content", () => {
    withCheckList((view, { done }) => {
      done.querySelector("p")?.click();
      expect(checkedItems(view)).toEqual([true, false]);
    });
  });

  test("ignores clicks that were already handled", () => {
    withCheckList((view, { done }) => {
      const event = new MouseEvent("click", { bubbles: true, cancelable: true });
      event.preventDefault();
      done.dispatchEvent(event);
      expect(checkedItems(view)).toEqual([true, false]);
    });
  });

  test("ignores clicks on an item that is no longer a checkbox", () => {
    withCheckList((view, { done }) => {
      done.role = null;
      done.click();
      expect(checkedItems(view)).toEqual([true, false]);
    });
  });
});
