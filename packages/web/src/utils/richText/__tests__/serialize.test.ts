import { describe, expect, test } from "vitest";
import * as Y from "yjs";
import { EditorState } from "prosemirror-state";
import { Schema, type Node } from "prosemirror-model";
import { prosemirrorToYXmlFragment } from "y-prosemirror";
import { serialize, serializeFragment } from "../serialize";
import { deserialize } from "../deserialize";
import { schema } from "../schema";
import { ListType, TextAlignment, TextFormat } from "../types";
import type { RichText } from "../types";
import { RICH_TEXT_DOCUMENTS } from "@/test/fixtures/richText";

// y-prosemirror only stores marks on text, so marks on inline atoms do not survive the fragment.
const LOSSY_FRAGMENTS: [keyof typeof RICH_TEXT_DOCUMENTS, RichText][] = [
  [
    "formatted date",
    [
      {
        type: "paragraph",
        align: TextAlignment.LEFT,
        children: [{ type: "date", value: "2026-10-13", format: TextFormat.NONE, theme: null }],
      },
    ],
  ],
  [
    "formatted dropdown",
    [
      {
        type: "paragraph",
        align: TextAlignment.LEFT,
        children: [
          { type: "dropdown", dropdownType: "priority", value: "High", format: TextFormat.NONE },
        ],
      },
    ],
  ],
  [
    "formatted mention",
    [
      {
        type: "paragraph",
        align: TextAlignment.LEFT,
        children: [
          { type: "mention", userId: "user-2", displayName: "Grace", format: TextFormat.NONE },
        ],
      },
    ],
  ],
];

function toFragment(doc: Node): Y.XmlFragment {
  const fragment = new Y.Doc().getXmlFragment("content");
  prosemirrorToYXmlFragment(doc, fragment);
  return fragment;
}

function serializeDoc(doc: Node): RichText {
  return serialize(EditorState.create({ doc }));
}

describe("serialize / deserialize round trips", () => {
  test.each(Object.entries(RICH_TEXT_DOCUMENTS))("%s", (name, content) => {
    const doc = deserialize(content);
    expect(() => doc.check()).not.toThrow();

    const serialized = serializeDoc(doc);
    expect(serialized).toEqual(content);
    expect(deserialize(serialized).eq(doc)).toBe(true);

    const lossy = LOSSY_FRAGMENTS.find(([lossyName]) => lossyName === name);
    expect(serializeFragment(toFragment(doc))).toEqual(lossy ? lossy[1] : content);
  });

  test("fixtures exercise every node and mark type in the schema", () => {
    const nodeNames = new Set<string>();
    const markNames = new Set<string>();
    for (const content of Object.values(RICH_TEXT_DOCUMENTS)) {
      const doc = deserialize(content);
      nodeNames.add(doc.type.name);
      doc.descendants((node) => {
        nodeNames.add(node.type.name);
        node.marks.forEach((mark) => markNames.add(mark.type.name));
      });
    }
    expect([...nodeNames].sort()).toEqual(Object.keys(schema.nodes).sort());
    expect([...markNames].sort()).toEqual(Object.keys(schema.marks).sort());
  });
});

describe("deserialize", () => {
  const normalisations: { name: string; input: RichText; output: RichText }[] = [
    {
      name: "defaults paragraph and heading alignment to left",
      input: [
        { type: "paragraph", children: [{ type: "text", text: "p", format: 0 }] },
        { type: "heading", level: 1, children: [{ type: "text", text: "h", format: 0 }] },
      ],
      output: [
        {
          type: "paragraph",
          align: TextAlignment.LEFT,
          children: [{ type: "text", text: "p", format: 0 }],
        },
        {
          type: "heading",
          level: 1,
          align: TextAlignment.LEFT,
          children: [{ type: "text", text: "h", format: 0 }],
        },
      ],
    },
    {
      name: "defaults list items to unchecked",
      input: [
        {
          type: "list",
          listType: ListType.ORDERED,
          children: [
            {
              type: "listitem",
              children: [{ type: "paragraph", align: TextAlignment.LEFT, children: [] }],
            },
          ],
        },
      ],
      output: [
        {
          type: "list",
          listType: ListType.ORDERED,
          children: [
            {
              type: "listitem",
              checked: false,
              children: [{ type: "paragraph", align: TextAlignment.LEFT, children: [] }],
            },
          ],
        },
      ],
    },
    {
      name: "defaults the date theme to null",
      input: [
        {
          type: "paragraph",
          align: TextAlignment.LEFT,
          children: [{ type: "date", value: "2026-10-13", format: 0 }],
        },
      ],
      output: [
        {
          type: "paragraph",
          align: TextAlignment.LEFT,
          children: [{ type: "date", value: "2026-10-13", format: 0, theme: null }],
        },
      ],
    },
    {
      name: "merges adjacent text with identical marks",
      input: [
        {
          type: "paragraph",
          align: TextAlignment.LEFT,
          children: [
            { type: "text", text: "a", format: TextFormat.BOLD },
            { type: "text", text: "b", format: TextFormat.BOLD },
            { type: "text", text: "c", format: 0 },
          ],
        },
      ],
      output: [
        {
          type: "paragraph",
          align: TextAlignment.LEFT,
          children: [
            { type: "text", text: "ab", format: TextFormat.BOLD },
            { type: "text", text: "c", format: 0 },
          ],
        },
      ],
    },
    {
      name: "ignores unknown format flags",
      input: [
        {
          type: "paragraph",
          align: TextAlignment.LEFT,
          children: [{ type: "text", text: "x", format: TextFormat.BOLD | (1 << 12) }],
        },
      ],
      output: [
        {
          type: "paragraph",
          align: TextAlignment.LEFT,
          children: [{ type: "text", text: "x", format: TextFormat.BOLD }],
        },
      ],
    },
  ];

  test.each(normalisations)("$name", ({ input, output }) => {
    expect(serializeDoc(deserialize(input))).toEqual(output);
  });

  test("returns an empty document for empty content", () => {
    const doc = deserialize([]);
    expect(doc.type).toBe(schema.nodes.doc);
    expect(doc.childCount).toBe(0);
    expect(serializeDoc(doc)).toEqual([]);
  });

  test("throws for an unknown node type", () => {
    // Deliberately malformed wire content.
    const content = [{ type: "table" }] as unknown as RichText;
    expect(() => deserialize(content)).toThrow("Unsupported node type: table");
  });

  test("throws for an unknown list type", () => {
    const content = [{ type: "list", listType: 7, children: [] }] as unknown as RichText;
    expect(() => deserialize(content)).toThrow("Unsupported list type: 7");
  });

  test("throws for invalid attribute values", () => {
    expect(() => deserialize([{ type: "heading", level: 1, indent: 99, children: [] }])).toThrow(
      RangeError,
    );
    expect(() =>
      deserialize([
        { type: "paragraph", children: [{ type: "text", text: "x", format: 0, color: "red" }] },
      ]),
    ).toThrow(RangeError);
    expect(() =>
      deserialize([
        {
          type: "paragraph",
          children: [{ type: "text", text: "x", format: 0, font: "comic-sans" }],
        },
      ]),
    ).toThrow(RangeError);
  });
});

describe("serialize", () => {
  test("throws for a node type outside the rich text schema", () => {
    const other = new Schema({
      nodes: { doc: { content: "block+" }, text: {}, widget: { group: "block" } },
    });
    const state = EditorState.create({
      doc: other.node("doc", null, [other.node("widget")]),
    });
    expect(() => serialize(state)).toThrow("Unsupported node type: widget");
  });
});

describe("serializeFragment", () => {
  test("returns an empty array for an empty fragment", () => {
    const fragment = new Y.Doc().getXmlFragment("content");
    expect(serializeFragment(fragment)).toEqual([]);
  });

  test("matches serialize for a fragment built from the same document", () => {
    const doc = deserialize(RICH_TEXT_DOCUMENTS["multiple top-level blocks"]);
    expect(serializeFragment(toFragment(doc))).toEqual(serializeDoc(doc));
  });
});
