import { describe, test, expect } from "vitest";
import { EditorState } from "prosemirror-state";
import { schema } from "../schema";
import { insertNode } from "../stream";

describe("insertNode", () => {
  test("inserts after top-level block when nested inside list", () => {
    const doc = schema.nodes.doc.create(null, [
      schema.nodes.unordered_list.create(null, [
        schema.nodes.list_item.create(null, [
          schema.nodes.paragraph.create(null, [schema.text("item")]),
        ]),
      ]),
    ]);
    const state = EditorState.create({ doc, schema });
    const tr = state.tr;

    // Insert heading from position inside the list
    const heading = schema.nodes.heading.create({ level: 1 });
    insertNode(tr, 5, heading);

    // Heading should be at top level, after the list
    expect(tr.doc.childCount).toBe(2);
    expect(tr.doc.child(0).type).toBe(schema.nodes.unordered_list);
    expect(tr.doc.child(1).type).toBe(schema.nodes.heading);
  });
});
