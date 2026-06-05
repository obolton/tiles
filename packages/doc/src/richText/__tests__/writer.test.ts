import { beforeEach, describe, expect, test } from "vitest";
import * as Y from "yjs";
import { YXmlStreamWriter } from "@/richText/writer";

function paragraph(text: string): Y.XmlElement {
  const el = new Y.XmlElement("paragraph");
  const content = new Y.XmlText();
  content.insert(0, text);
  el.insert(0, [content]);
  return el;
}

/** A readable structural view of the produced Y.Xml. */
function serialize(node: Y.XmlElement | Y.XmlText | Y.XmlHook): unknown {
  if (node instanceof Y.XmlText) {
    return node.toDelta();
  }
  if (!(node instanceof Y.XmlElement)) {
    throw new Error(`unexpected node: ${node.constructor.name}`);
  }
  const attrs = node.getAttributes();
  return {
    name: node.nodeName,
    ...(Object.keys(attrs).length > 0 ? { attrs } : {}),
    children: node.toArray().map(serialize),
  };
}

function blocks(fragment: Y.XmlFragment): unknown[] {
  return fragment.toArray().map(serialize);
}

describe("YXmlStreamWriter", () => {
  describe("append", () => {
    let fragment: Y.XmlFragment;
    let writer: YXmlStreamWriter;

    beforeEach(() => {
      fragment = new Y.Doc().getXmlFragment("content");
      writer = new YXmlStreamWriter(fragment, "append");
    });

    test("writes a paragraph with text", () => {
      writer.apply({ type: "paragraph" });
      writer.apply("hello world");

      expect(blocks(fragment)).toEqual([
        {
          name: "paragraph",
          attrs: { align: "left" },
          children: [[{ insert: "hello world" }]],
        },
      ]);
    });

    test("applies bold and italic as formatting attributes", () => {
      writer.apply({ type: "paragraph" });
      writer.apply("a");
      writer.apply({ bold: true });
      writer.apply("b");
      writer.apply({ italic: true });
      writer.apply("c");
      writer.apply({ bold: false });
      writer.apply({ italic: false });
      writer.apply("d");

      const text = (fragment.get(0) as Y.XmlElement).get(0) as Y.XmlText;
      expect(text.toDelta()).toEqual([
        { insert: "a" },
        { insert: "b", attributes: { bold: {} } },
        { insert: "c", attributes: { bold: {}, italic: {} } },
        { insert: "d" },
      ]);
    });

    test("writes a heading with a numeric level attribute", () => {
      writer.apply({ type: "heading", level: 2 });
      writer.apply("Title");

      expect(blocks(fragment)).toEqual([
        {
          name: "heading",
          attrs: { align: "left", level: 2 },
          children: [[{ insert: "Title" }]],
        },
      ]);
    });

    test("writes a code block and ignores active marks inside it", () => {
      writer.apply({ bold: true });
      writer.apply({ type: "code", language: "ts", lineNumbers: false });
      writer.apply("const x = 1;");

      expect(blocks(fragment)).toEqual([
        {
          name: "codeBlock",
          attrs: { language: "ts", lineNumbers: false },
          children: [[{ insert: "const x = 1;" }]],
        },
      ]);
    });

    test("writes a divider between paragraphs", () => {
      writer.apply({ type: "paragraph" });
      writer.apply("before");
      writer.apply({ type: "divider" });
      writer.apply({ type: "paragraph" });
      writer.apply("after");

      expect(blocks(fragment)).toEqual([
        {
          name: "paragraph",
          attrs: { align: "left" },
          children: [[{ insert: "before" }]],
        },
        { name: "divider", children: [] },
        {
          name: "paragraph",
          attrs: { align: "left" },
          children: [[{ insert: "after" }]],
        },
      ]);
    });

    test("nests list items by depth", () => {
      writer.apply({ type: "listitem", listType: "unordered", depth: 0 });
      writer.apply("a");
      writer.apply({ type: "listitem", listType: "unordered", depth: 1 });
      writer.apply("b");
      writer.apply({ type: "listitem", listType: "unordered", depth: 0 });
      writer.apply("c");

      expect(blocks(fragment)).toEqual([
        {
          name: "unordered_list",
          children: [
            {
              name: "list_item",
              attrs: { checked: false },
              children: [
                {
                  name: "paragraph",
                  attrs: { align: "left" },
                  children: [[{ insert: "a" }]],
                },
                {
                  name: "unordered_list",
                  children: [
                    {
                      name: "list_item",
                      attrs: { checked: false },
                      children: [
                        {
                          name: "paragraph",
                          attrs: { align: "left" },
                          children: [[{ insert: "b" }]],
                        },
                      ],
                    },
                  ],
                },
              ],
            },
            {
              name: "list_item",
              attrs: { checked: false },
              children: [
                {
                  name: "paragraph",
                  attrs: { align: "left" },
                  children: [[{ insert: "c" }]],
                },
              ],
            },
          ],
        },
      ]);
    });

    test("exits a list when a paragraph follows", () => {
      writer.apply({ type: "listitem", listType: "ordered", depth: 0 });
      writer.apply("item");
      writer.apply({ type: "paragraph" });
      writer.apply("after");

      expect(blocks(fragment)).toEqual([
        {
          name: "ordered_list",
          attrs: { order: 1 },
          children: [
            {
              name: "list_item",
              attrs: { checked: false },
              children: [
                {
                  name: "paragraph",
                  attrs: { align: "left" },
                  children: [[{ insert: "item" }]],
                },
              ],
            },
          ],
        },
        {
          name: "paragraph",
          attrs: { align: "left" },
          children: [[{ insert: "after" }]],
        },
      ]);
    });
  });

  describe("replace", () => {
    let fragment: Y.XmlFragment;
    let writer: YXmlStreamWriter;

    beforeEach(() => {
      fragment = new Y.Doc().getXmlFragment("content");
      fragment.insert(0, [paragraph("old")]);
      writer = new YXmlStreamWriter(fragment, "replace");
    });

    test("clears existing content first", () => {
      writer.apply({ type: "paragraph" });
      writer.apply("new");

      expect(blocks(fragment)).toEqual([
        {
          name: "paragraph",
          attrs: { align: "left" },
          children: [[{ insert: "new" }]],
        },
      ]);
    });
  });

  describe("prepend", () => {
    let fragment: Y.XmlFragment;
    let writer: YXmlStreamWriter;

    beforeEach(() => {
      fragment = new Y.Doc().getXmlFragment("content");
      fragment.insert(0, [paragraph("old")]);
      writer = new YXmlStreamWriter(fragment, "prepend");
    });

    test("inserts before existing content", () => {
      writer.apply({ type: "paragraph" });
      writer.apply("new");

      expect(blocks(fragment)).toEqual([
        {
          name: "paragraph",
          attrs: { align: "left" },
          children: [[{ insert: "new" }]],
        },
        { name: "paragraph", children: [[{ insert: "old" }]] },
      ]);
    });
  });
});
