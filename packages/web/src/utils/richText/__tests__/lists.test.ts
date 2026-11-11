import { afterEach, describe, expect, test } from "vitest";
import { EditorState } from "prosemirror-state";
import { EditorView } from "prosemirror-view";
import type { Node, NodeType } from "prosemirror-model";
import { schema } from "../schema";
import { lists } from "../lists";

const { list_item, ordered_list, unordered_list, check_list, paragraph } = schema.nodes;

const item = (text: string, checked?: boolean) =>
  list_item.create(
    checked === undefined ? null : { checked },
    paragraph.create(null, schema.text(text)),
  );

let view: EditorView | null = null;

function mount(...blocks: Node[]) {
  const state = EditorState.create({
    doc: schema.nodes.doc.create(null, blocks),
    plugins: [lists()],
  });
  view = new EditorView(document.createElement("div"), { state });
  return view;
}

function roles(listView: EditorView) {
  return [...listView.dom.querySelectorAll("li")].map((li) => [
    li.getAttribute("role"),
    li.getAttribute("aria-checked"),
  ]);
}

afterEach(() => {
  view?.destroy();
  view = null;
});

describe("list_item node", () => {
  test("has no checked state by default", () => {
    expect(list_item.create(null, paragraph.create()).attrs.checked).toBeUndefined();
  });
});

describe("lists", () => {
  test.each([ordered_list, unordered_list])(
    "does not expose %s items as checkboxes",
    (listType: NodeType) => {
      const listView = mount(listType.create(null, [item("One"), item("Two", false)]));
      expect(roles(listView)).toEqual([
        [null, null],
        [null, null],
      ]);
    },
  );

  test("exposes check list items as checkboxes", () => {
    const listView = mount(
      check_list.create(null, [item("Done", true), item("Todo", false), item("New")]),
    );
    expect(roles(listView)).toEqual([
      ["checkbox", "true"],
      ["checkbox", "false"],
      ["checkbox", "false"],
    ]);
  });

  test("does not expose items of a list nested in a check list item as checkboxes", () => {
    const nested = list_item.create({ checked: false }, [
      paragraph.create(null, schema.text("Parent")),
      unordered_list.create(null, [item("Child")]),
    ]);
    const listView = mount(check_list.create(null, [nested]));
    expect(roles(listView)).toEqual([
      ["checkbox", "false"],
      [null, null],
    ]);
  });

  test("toggles a check list item when clicked", () => {
    const listView = mount(check_list.create(null, [item("Todo")]));
    listView.dom.querySelector("li")?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    expect(listView.state.doc.firstChild?.firstChild?.attrs.checked).toBe(true);
    expect(roles(listView)).toEqual([["checkbox", "true"]]);
  });

  test("does not toggle an ordinary list item when clicked", () => {
    const listView = mount(ordered_list.create(null, [item("One")]));
    listView.dom.querySelector("li")?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    expect(listView.state.doc.firstChild?.firstChild?.attrs.checked).toBeUndefined();
  });

  test("updates item roles when the list type changes", () => {
    const listView = mount(ordered_list.create(null, [item("One")]));
    listView.dispatch(listView.state.tr.setNodeMarkup(0, check_list));
    expect(roles(listView)).toEqual([["checkbox", "false"]]);
    listView.dispatch(listView.state.tr.setNodeMarkup(0, unordered_list));
    expect(roles(listView)).toEqual([[null, null]]);
  });
});
