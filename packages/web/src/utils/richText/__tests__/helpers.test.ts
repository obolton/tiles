import { describe, expect, test } from "vitest";
import { AllSelection, EditorState, TextSelection } from "prosemirror-state";
import { schema } from "@/utils/richText/schema";
import { getSelectionAlignment, getSelectionIndent, getSelectionLineHeight } from "../helpers";

const doc = schema.node("doc", null, [
  schema.node("paragraph", { align: "center", lineHeight: 1.5, indent: 1 }, [schema.text("First")]),
  schema.node("unordered_list", null, [
    schema.node("list_item", null, [
      schema.node("paragraph", { align: "right" }, [schema.text("Item")]),
    ]),
  ]),
]);

function stateWithCursorIn(text: string) {
  let position = -1;
  doc.descendants((node, pos) => {
    if (node.isText && node.text === text) {
      position = pos + 1;
    }
  });
  return EditorState.create({ doc, selection: TextSelection.create(doc, position) });
}

describe("getSelectionAlignment", () => {
  test("returns the alignment of the block containing the cursor", () => {
    expect(getSelectionAlignment(stateWithCursorIn("First"))).toBe("center");
    expect(getSelectionAlignment(stateWithCursorIn("Item"))).toBe("right");
  });

  test("returns the alignment of the first block when the whole document is selected", () => {
    const state = EditorState.create({ doc, selection: new AllSelection(doc) });
    expect(getSelectionAlignment(state)).toBe("center");
  });
});

describe("getSelectionLineHeight", () => {
  test("returns the line height of the first block when the whole document is selected", () => {
    const state = EditorState.create({ doc, selection: new AllSelection(doc) });
    expect(getSelectionLineHeight(state)).toBe(1.5);
  });
});

describe("getSelectionIndent", () => {
  test("returns the indent of the first block when the whole document is selected", () => {
    const state = EditorState.create({ doc, selection: new AllSelection(doc) });
    expect(getSelectionIndent(state)).toBe(1);
  });
});
