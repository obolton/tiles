import { describe, expect, test } from "vitest";
import * as Y from "yjs";
import { prosemirrorToYXmlFragment } from "y-prosemirror";
import type { Node } from "prosemirror-model";
import { fragmentToPlainText, toPlainText } from "../plainText";
import { schema } from "../schema";
import type { RichText } from "doc/types/richText";

function toFragment(...blocks: Node[]): Y.XmlFragment {
  const doc = new Y.Doc();
  const fragment = doc.getXmlFragment("content");
  prosemirrorToYXmlFragment(schema.node("doc", null, blocks), fragment);
  return fragment;
}

describe("fragmentToPlainText", () => {
  test("returns an empty string for an empty fragment", () => {
    const fragment = new Y.Doc().getXmlFragment("content");
    expect(fragmentToPlainText(fragment)).toBe("");
  });

  test("extracts text from a single paragraph", () => {
    const fragment = toFragment(schema.node("paragraph", null, [schema.text("Hello")]));
    expect(fragmentToPlainText(fragment)).toBe("Hello\n");
  });

  test("separates block elements with newlines", () => {
    const fragment = toFragment(
      schema.node("heading", { level: 1 }, [schema.text("Title")]),
      schema.node("paragraph", null, [schema.text("Body")]),
    );
    expect(fragmentToPlainText(fragment)).toBe("Title\nBody\n");
  });

  test("accepts a single XmlElement", () => {
    const fragment = toFragment(schema.node("paragraph", null, [schema.text("Hello")]));
    const element = fragment.get(0) as Y.XmlElement;
    expect(fragmentToPlainText(element)).toBe("Hello\n");
  });

  test("skips embedded tiles without a resolver", () => {
    const fragment = toFragment(
      schema.node("paragraph", null, [schema.text("Before")]),
      schema.node("tile", { id: "tile-1" }),
      schema.node("paragraph", null, [schema.text("After")]),
    );
    expect(fragmentToPlainText(fragment)).toBe("Before\nAfter\n");
  });

  test("describes embedded tiles with the resolver", () => {
    const fragment = toFragment(
      schema.node("paragraph", null, [schema.text("Before")]),
      schema.node("tile", { id: "tile-1" }),
    );
    expect(fragmentToPlainText(fragment, { tile: (id) => `Image ${id}` })).toBe(
      "Before\nImage tile-1\n",
    );
  });
});

describe("toPlainText", () => {
  test("formats a rich text document as plain text", () => {
    const text: RichText = [
      {
        type: "heading",
        level: 1,
        children: [{ type: "text", text: "Heading", format: 0 }],
      },
      {
        type: "paragraph",
        children: [
          { type: "text", text: "First", format: 0 },
          { type: "text", text: " line", format: 1 },
        ],
      },
      {
        type: "paragraph",
        children: [{ type: "text", text: "Second line", format: 0 }],
      },
      {
        type: "paragraph",
        children: [
          {
            type: "dropdown",
            dropdownType: "dropdown",
            value: "DONE",
            format: 0,
          },
        ],
      },
      {
        type: "list",
        listType: 0,
        children: [
          {
            type: "listitem",
            children: [
              {
                type: "paragraph",
                children: [{ type: "text", text: "List item", format: 0 }],
              },
            ],
          },
        ],
      },
    ];
    expect(toPlainText(text)).toBe("Heading\nFirst line\nSecond line\nDONE\nList item\n");
  });

  test("describes embedded tiles with the resolver", () => {
    const text: RichText = [
      { type: "paragraph", children: [{ type: "text", text: "Before", format: 0 }] },
      { type: "tile", id: "tile-1" },
    ];
    expect(toPlainText(text)).toBe("Before\n");
    expect(toPlainText(text, { tile: (id) => `Table ${id}` })).toBe("Before\nTable tile-1\n");
  });
});
