import { describe, expect, test } from "vitest";
import * as Y from "yjs";
import { encodeSelection, decodeSelection } from "@/richText/selection";

describe("selection codec", () => {
  test("round-trips relative positions through base64", () => {
    const doc = new Y.Doc();
    const text = new Y.XmlText();
    doc.getXmlFragment("content").insert(0, [text]);
    text.insert(0, "hello world");

    const decoded = decodeSelection(
      encodeSelection({
        from: Y.createRelativePositionFromTypeIndex(text, 2),
        to: Y.createRelativePositionFromTypeIndex(text, 7),
      }),
    );
    if (!decoded) {
      throw new Error("expected a decoded selection");
    }

    const from = Y.createAbsolutePositionFromRelativePosition(
      decoded.from,
      doc,
    );
    const to = Y.createAbsolutePositionFromRelativePosition(decoded.to, doc);
    expect(from?.index).toBe(2);
    expect(to?.index).toBe(7);
  });

  test("returns null for an undecodable payload", () => {
    expect(decodeSelection({ from: "", to: "" })).toBeNull();
  });
});
