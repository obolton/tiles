import { describe, expect, test } from "vitest";
import type { Node } from "prosemirror-model";
import { DecorationSet } from "prosemirror-view";
import {
  cl,
  createEditorState,
  createView,
  cursorAfter,
  doc,
  li,
  p,
} from "@/test/helpers/richText";
import { lists } from "../lists";

function createListItemView(node: Node, getPos: () => number | undefined = () => 1) {
  const content = doc(cl(node));
  const { view, transactions } = createView(
    createEditorState(content, cursorAfter(content, "Task")),
  );
  const construct = lists().props.nodeViews?.list_item;
  if (!construct) {
    throw new Error("Missing list_item node view");
  }
  const nodeView = construct(node, view, getPos, [], DecorationSet.empty);
  return { nodeView, view, transactions, dom: nodeView.dom as HTMLLIElement };
}

function click(target: Element, init: MouseEventInit = {}) {
  const event = new MouseEvent("click", { bubbles: true, cancelable: true, ...init });
  target.dispatchEvent(event);
  return event;
}

describe("lists", () => {
  describe("list item node view", () => {
    test("exposes a checked item as a checked checkbox", () => {
      const { dom } = createListItemView(li({ checked: true }, p("Task")));

      expect(dom.tagName).toBe("LI");
      expect(dom.role).toBe("checkbox");
      expect(dom.ariaChecked).toBe("true");
    });

    test("exposes an unchecked item as an unchecked checkbox", () => {
      const { dom } = createListItemView(li({ checked: false }, p("Task")));

      expect(dom.role).toBe("checkbox");
      expect(dom.ariaChecked).toBe("false");
    });

    test("updates the checkbox state from a new node", () => {
      const { nodeView, dom } = createListItemView(li({ checked: false }, p("Task")));

      expect(nodeView.update?.(li({ checked: true }, p("Task")), [], DecorationSet.empty)).toBe(
        true,
      );
      expect(dom.ariaChecked).toBe("true");
    });

    test("toggles the checked attribute on click", () => {
      const { dom, view, transactions } = createListItemView(li({ checked: false }, p("Task")));

      const event = click(dom);

      expect(event.defaultPrevented).toBe(true);
      expect(transactions).toHaveLength(1);
      expect(view.state.doc.firstChild?.firstChild?.attrs.checked).toBe(true);
    });

    test("ignores clicks on the item's content", () => {
      const { dom, transactions } = createListItemView(li({ checked: false }, p("Task")));
      const child = dom.appendChild(document.createElement("p"));

      const event = click(child);

      expect(event.defaultPrevented).toBe(false);
      expect(transactions).toHaveLength(0);
    });

    test("ignores clicks that were already handled", () => {
      const { dom, transactions } = createListItemView(li({ checked: false }, p("Task")));
      dom.addEventListener("click", (event) => event.preventDefault(), {
        capture: true,
        once: true,
      });

      click(dom);

      expect(transactions).toHaveLength(0);
    });

    test("ignores clicks when the node has no position", () => {
      const { dom, transactions } = createListItemView(
        li({ checked: false }, p("Task")),
        () => undefined,
      );

      click(dom);

      expect(transactions).toHaveLength(0);
    });

    test("ignores other events", () => {
      const { dom, transactions } = createListItemView(li({ checked: false }, p("Task")));

      dom.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));

      expect(transactions).toHaveLength(0);
    });
  });
});
