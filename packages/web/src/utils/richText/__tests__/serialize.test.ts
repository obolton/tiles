import { describe, expect, test } from "vitest";
import * as Y from "yjs";
import { prosemirrorToYXmlFragment } from "y-prosemirror";
import { serializeFragment } from "../serialize";
import { deserialize } from "../deserialize";
import { TextFormat } from "../types";
import type { RichText } from "../types";

function toFragment(content: RichText): Y.XmlFragment {
  const doc = new Y.Doc();
  const fragment = doc.getXmlFragment("content");
  prosemirrorToYXmlFragment(deserialize(content), fragment);
  return fragment;
}

describe("serializeFragment", () => {
  test("returns an empty array for an empty fragment", () => {
    const fragment = new Y.Doc().getXmlFragment("content");
    expect(serializeFragment(fragment)).toEqual([]);
  });

  test("round-trips a paragraph with formatted inline text", () => {
    const content: RichText = [
      {
        type: "paragraph",
        align: 0,
        children: [
          { type: "text", text: "Plain ", format: TextFormat.NONE },
          { type: "text", text: "bold", format: TextFormat.BOLD },
        ],
      },
    ];
    expect(serializeFragment(toFragment(content))).toEqual(content);
  });

  test("round-trips a heading with level and alignment", () => {
    const content: RichText = [
      {
        type: "heading",
        level: 2,
        align: 1,
        children: [{ type: "text", text: "Title", format: TextFormat.NONE }],
      },
    ];
    expect(serializeFragment(toFragment(content))).toEqual(content);
  });

  test("round-trips a checklist with nested paragraphs", () => {
    const content: RichText = [
      {
        type: "list",
        listType: 2,
        children: [
          {
            type: "listitem",
            checked: true,
            children: [
              {
                type: "paragraph",
                align: 0,
                children: [
                  { type: "text", text: "Done", format: TextFormat.NONE },
                ],
              },
            ],
          },
        ],
      },
    ];
    expect(serializeFragment(toFragment(content))).toEqual(content);
  });
});
