import { describe, expect, test } from "vitest";
import * as Y from "yjs";
import { EditorState } from "prosemirror-state";
import { prosemirrorToYXmlFragment, yXmlFragmentToProseMirrorRootNode } from "y-prosemirror";
import { schema } from "@/utils/richText/schema";
import { YXmlStreamWriter } from "doc/richText/writer";
import type { DestinationMode, RichTextContent } from "doc/richText/events";

// Verifies that YXmlStreamWriter's output matches y-prosemirror.

function definedAttrs(node: Y.XmlElement): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(node.getAttributes()).filter(([, value]) => value !== undefined),
  );
}

function serialize(node: Y.XmlElement | Y.XmlText | Y.XmlHook): unknown {
  if (node instanceof Y.XmlText) {
    return node.toDelta();
  }
  if (!(node instanceof Y.XmlElement)) {
    throw new Error(`unexpected node: ${node.constructor.name}`);
  }
  const attrs = definedAttrs(node);
  return {
    name: node.nodeName,
    ...(Object.keys(attrs).length > 0 ? { attrs } : {}),
    children: node.toArray().map(serialize),
  };
}

function blocks(fragment: Y.XmlFragment): unknown[] {
  return fragment.toArray().map(serialize);
}

function emptyDoc() {
  return EditorState.create({ schema }).doc;
}

function write(mode: DestinationMode, events: RichTextContent[]) {
  const fragment = new Y.Doc().getXmlFragment("content");
  prosemirrorToYXmlFragment(emptyDoc(), fragment);
  const writer = new YXmlStreamWriter(fragment, mode);
  for (const event of events) {
    writer.apply(event);
  }
  return fragment;
}

function reencode(fragment: Y.XmlFragment) {
  const doc = yXmlFragmentToProseMirrorRootNode(fragment, schema);
  const out = new Y.Doc().getXmlFragment("content");
  prosemirrorToYXmlFragment(doc, out);
  return out;
}

const FIXTURES: { name: string; events: RichTextContent[] }[] = [
  { name: "a paragraph", events: [{ type: "paragraph" }, "Hello world"] },
  {
    name: "bold and italic spans",
    events: [
      { type: "paragraph" },
      "plain ",
      { bold: true },
      "bold",
      { bold: false },
      " and ",
      { italic: true },
      "italic",
      { italic: false },
      " end",
    ],
  },
  {
    name: "soft and hard line breaks",
    events: [{ type: "paragraph" }, "first", " second", "\nthird"],
  },
  {
    name: "headings of each level",
    events: [
      { type: "heading", level: 1 },
      "H1",
      { type: "heading", level: 2 },
      "H2",
      { type: "heading", level: 3 },
      "H3",
    ],
  },
  {
    name: "multiple paragraphs",
    events: [
      { type: "paragraph" },
      "one",
      { type: "paragraph" },
      "two",
      { type: "paragraph" },
      "three",
    ],
  },
  {
    name: "an unordered list",
    events: [
      { type: "listitem", listType: "unordered", depth: 0 },
      "first",
      { type: "listitem", listType: "unordered", depth: 0 },
      "second",
    ],
  },
  {
    name: "an ordered list",
    events: [
      { type: "listitem", listType: "ordered", depth: 0 },
      "one",
      { type: "listitem", listType: "ordered", depth: 0 },
      "two",
    ],
  },
  {
    name: "a nested list (0 → 1 → 2 → 1 → 0)",
    events: [
      { type: "listitem", listType: "unordered", depth: 0 },
      "a",
      { type: "listitem", listType: "unordered", depth: 1 },
      "b",
      { type: "listitem", listType: "unordered", depth: 2 },
      "c",
      { type: "listitem", listType: "unordered", depth: 1 },
      "d",
      { type: "listitem", listType: "unordered", depth: 0 },
      "e",
    ],
  },
  {
    name: "a list followed by a paragraph",
    events: [
      { type: "listitem", listType: "unordered", depth: 0 },
      "item",
      { type: "paragraph" },
      "after",
    ],
  },
  {
    name: "a code block",
    events: [{ type: "code", language: "ts", lineNumbers: false }, "const x = 1;"],
  },
  {
    name: "a divider between paragraphs",
    events: [{ type: "paragraph" }, "before", { type: "divider" }, { type: "paragraph" }, "after"],
  },
  {
    name: "bold within a heading",
    events: [
      { type: "heading", level: 2 },
      "A ",
      { bold: true },
      "bold",
      { bold: false },
      " title",
    ],
  },
  {
    name: "bold within a list item",
    events: [
      { type: "listitem", listType: "unordered", depth: 0 },
      "plain ",
      { bold: true },
      "bold",
      { bold: false },
      { type: "listitem", listType: "unordered", depth: 0 },
      "second",
    ],
  },
  {
    name: "a mark spanning a block break",
    events: [
      { type: "paragraph" },
      { bold: true },
      "before",
      { type: "paragraph" },
      "after",
      { bold: false },
    ],
  },
  {
    name: "active marks are dropped inside a code block",
    events: [{ bold: true }, { type: "code", language: "js", lineNumbers: false }, "const x = 1;"],
  },
];

describe("YXmlStreamWriter matches y-prosemirror's representation", () => {
  describe.each(["append", "replace", "prepend"] as const)("%s", (mode) => {
    test.each(FIXTURES)("$name", ({ events }) => {
      const fragment = write(mode, events);
      expect(blocks(fragment)).toEqual(blocks(reencode(fragment)));
    });
  });
});
