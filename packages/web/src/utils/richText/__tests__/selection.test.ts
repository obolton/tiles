import { describe, expect, test } from "vitest";
import * as Y from "yjs";
import { EditorState, TextSelection } from "prosemirror-state";
import { ySyncPlugin, prosemirrorToYXmlFragment, initProseMirrorDoc } from "y-prosemirror";
import { schema } from "@/utils/richText/schema";
import { decodeSelection } from "doc/richText/selection";
import { serializeSelection } from "../selection";

describe("serializeSelection", () => {
  test("returns null when the state has no Yjs binding", () => {
    expect(serializeSelection(EditorState.create({ schema }))).toBeNull();
  });

  test("encodes the selection as resolvable Yjs positions", () => {
    const doc = new Y.Doc();
    const fragment = doc.getXmlFragment("content");
    prosemirrorToYXmlFragment(
      schema.topNodeType.create(null, [
        schema.node("paragraph", null, [schema.text("Hello world")]),
      ]),
      fragment,
    );
    const { doc: pmDoc, mapping } = initProseMirrorDoc(fragment, schema);

    // Select "llo" — ProseMirror positions 3–6 in "<p>Hello world</p>".
    const state = EditorState.create({
      doc: pmDoc,
      selection: TextSelection.create(pmDoc, 3, 6),
      plugins: [ySyncPlugin(fragment, { mapping })],
    });

    const serialized = serializeSelection(state);
    if (!serialized) {
      throw new Error("expected a serialized selection");
    }
    const range = decodeSelection(serialized);
    if (!range) {
      throw new Error("expected a decoded range");
    }

    const from = Y.createAbsolutePositionFromRelativePosition(range.from, doc);
    const to = Y.createAbsolutePositionFromRelativePosition(range.to, doc);
    expect(from?.index).toBe(2);
    expect(to?.index).toBe(5);
  });
});
