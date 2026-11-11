import { describe, expect, test } from "vitest";
import { EditorState, TextSelection } from "prosemirror-state";
import type { Command } from "prosemirror-state";
import type { Node } from "prosemirror-model";
import { schema } from "../schema";
import { toggleCheckList, toggleOrderedList, toggleUnorderedList } from "../commands";

const { list_item, ordered_list, check_list, paragraph } = schema.nodes;

const item = (text: string, checked?: boolean) =>
  list_item.create(
    checked === undefined ? null : { checked },
    paragraph.create(null, schema.text(text)),
  );

function run(command: Command, ...blocks: Node[]) {
  const doc = schema.nodes.doc.create(null, blocks);
  let state = EditorState.create({ doc });
  state = state.apply(state.tr.setSelection(TextSelection.atStart(state.doc)));
  command(state, (tr) => {
    state = state.apply(tr);
  });
  return state.doc;
}

function checkedStates(list: Node | null | undefined) {
  const states: unknown[] = [];
  list?.forEach((child) => states.push(child.attrs.checked));
  return states;
}

describe("toggleList", () => {
  test.each([
    ["ordered", toggleOrderedList],
    ["unordered", toggleUnorderedList],
  ])("wraps a paragraph in an %s list without a checked state", (_name, command) => {
    const doc = run(command, paragraph.create(null, schema.text("One")));
    expect(checkedStates(doc.firstChild)).toEqual([undefined]);
  });

  test("wraps a paragraph in a check list with an unchecked state", () => {
    const doc = run(toggleCheckList, paragraph.create(null, schema.text("Todo")));
    expect(doc.firstChild?.type).toBe(check_list);
    expect(checkedStates(doc.firstChild)).toEqual([false]);
  });

  test("gives items an explicit checked state when converting to a check list", () => {
    const doc = run(toggleCheckList, ordered_list.create(null, [item("One"), item("Two")]));
    expect(doc.firstChild?.type).toBe(check_list);
    expect(checkedStates(doc.firstChild)).toEqual([false, false]);
  });

  test("clears the checked state when converting from a check list", () => {
    const doc = run(
      toggleOrderedList,
      check_list.create(null, [item("Done", true), item("Todo", false)]),
    );
    expect(doc.firstChild?.type).toBe(ordered_list);
    expect(checkedStates(doc.firstChild)).toEqual([undefined, undefined]);
  });
});
