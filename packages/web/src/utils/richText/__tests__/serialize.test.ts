import { describe, expect, test } from "vitest";
import * as Y from "yjs";
import { EditorState } from "prosemirror-state";
import { Schema, type Node } from "prosemirror-model";
import { prosemirrorToYXmlFragment } from "y-prosemirror";
import { serialize, serializeFragment } from "../serialize";
import { deserialize } from "../deserialize";
import { schema } from "../schema";
import { ListType, TextAlignment, TextFormat } from "../types";
import type {
  BlockNode,
  BlockStyle,
  DateNode,
  DropdownNode,
  HeadingNode,
  InlineNode,
  ListItemNode,
  ListNode,
  MentionNode,
  ParagraphNode,
  RichText,
  TextNode,
} from "../types";

interface Fixture {
  name: string;
  content: RichText;
  // Expected result of the Y.XmlFragment round trip when it is lossy.
  fragment?: RichText;
}

function text(value: string, format = TextFormat.NONE, rest: Partial<TextNode> = {}): TextNode {
  return { type: "text", text: value, format, ...rest };
}

function paragraph(children: InlineNode[], style: BlockStyle = {}): ParagraphNode {
  return { type: "paragraph", align: TextAlignment.LEFT, ...style, children };
}

function heading(
  level: HeadingNode["level"],
  children: InlineNode[],
  style: BlockStyle & { theme?: string } = {},
): HeadingNode {
  return { type: "heading", level, align: TextAlignment.LEFT, ...style, children };
}

function listItem(children: BlockNode[], checked: boolean | undefined = false): ListItemNode {
  return { type: "listitem", checked, children };
}

function list(listType: ListType, children: ListItemNode[]): ListNode {
  return { type: "list", listType, children };
}

function date(value: string, rest: Partial<DateNode> = {}): DateNode {
  return { type: "date", value, format: TextFormat.NONE, theme: null, ...rest };
}

function dropdown(rest: Partial<DropdownNode> = {}): DropdownNode {
  return {
    type: "dropdown",
    dropdownType: "status",
    value: "Done",
    format: TextFormat.NONE,
    ...rest,
  };
}

function mention(rest: Partial<MentionNode> = {}): MentionNode {
  return {
    type: "mention",
    userId: "user-1",
    displayName: "Ada",
    format: TextFormat.NONE,
    ...rest,
  };
}

const COLOR = "ff0000ff0000";
const FONT = "lora";

const FORMATS: [string, TextFormat][] = [
  ["bold", TextFormat.BOLD],
  ["italic", TextFormat.ITALIC],
  ["underline", TextFormat.UNDERLINE],
  ["strikethrough", TextFormat.STRIKETHROUGH],
  ["highlight", TextFormat.HIGHLIGHT],
  ["superscript", TextFormat.SUPERSCRIPT],
  ["subscript", TextFormat.SUBSCRIPT],
  ["small caps", TextFormat.SMALL_CAPS],
  ["code", TextFormat.CODE],
];

const ALIGNMENTS: [string, TextAlignment][] = [
  ["left", TextAlignment.LEFT],
  ["center", TextAlignment.CENTER],
  ["right", TextAlignment.RIGHT],
  ["justify", TextAlignment.JUSTIFY],
];

const markFixtures: Fixture[] = [
  ...FORMATS.map(([name, format]): Fixture => ({
    name: `${name} text`,
    content: [paragraph([text("plain"), text(name, format), text("plain again")])],
  })),
  { name: "text size", content: [paragraph([text("big", TextFormat.NONE, { size: 1.5 })])] },
  { name: "text color", content: [paragraph([text("red", TextFormat.NONE, { color: COLOR })])] },
  { name: "text font", content: [paragraph([text("serif", TextFormat.NONE, { font: FONT })])] },
  {
    name: "every format flag and attribute mark on one text node",
    content: [
      paragraph([
        text(
          "everything",
          TextFormat.BOLD |
            TextFormat.ITALIC |
            TextFormat.STRIKETHROUGH |
            TextFormat.UNDERLINE |
            TextFormat.HIGHLIGHT |
            TextFormat.SUPERSCRIPT |
            TextFormat.SMALL_CAPS |
            TextFormat.CODE,
          { size: 0.75, color: COLOR, font: FONT },
        ),
        text("subscript", TextFormat.SUBSCRIPT | TextFormat.BOLD, { size: 2.5 }),
      ]),
    ],
  },
];

const blockFixtures: Fixture[] = [
  { name: "empty paragraph", content: [paragraph([])] },
  { name: "whitespace-only text", content: [paragraph([text("   ")])] },
  { name: "heading level 1", content: [heading(1, [text("Title")])] },
  { name: "heading level 2", content: [heading(2, [text("Title")])] },
  { name: "heading level 3", content: [heading(3, [text("Title")])] },
  { name: "heading with theme", content: [heading(1, [text("Title")], { theme: "accent" })] },
  { name: "empty heading", content: [heading(2, [])] },
  {
    name: "quote containing every allowed block",
    content: [
      {
        type: "quote",
        children: [
          paragraph([text("Quoted", TextFormat.ITALIC)]),
          heading(3, [text("Attribution")]),
          list(ListType.ORDERED, [listItem([paragraph([text("Point")])])]),
          list(ListType.UNORDERED, [listItem([paragraph([text("Point")])])]),
          list(ListType.CHECK, [listItem([paragraph([text("Point")])], true)]),
          { type: "divider" },
        ],
      },
    ],
  },
  {
    name: "code block with language and line numbers",
    content: [
      {
        type: "code",
        language: "typescript",
        lineNumbers: true,
        children: [text("function add(a: number) {\n  return a + 1;\n}\n")],
      },
    ],
  },
  {
    name: "empty code block",
    content: [{ type: "code", language: "", lineNumbers: false, children: [] }],
  },
  { name: "divider", content: [{ type: "divider" }] },
  {
    name: "ordered list",
    content: [
      list(ListType.ORDERED, [
        listItem([paragraph([text("One")])]),
        listItem([paragraph([text("Two")])]),
      ]),
    ],
  },
  {
    name: "unordered list",
    content: [list(ListType.UNORDERED, [listItem([paragraph([text("Bullet")])])])],
  },
  {
    name: "check list with checked and unchecked items",
    content: [
      list(ListType.CHECK, [
        listItem([paragraph([text("Done")])], true),
        listItem([paragraph([text("Todo")])], false),
      ]),
    ],
  },
  {
    name: "nested lists",
    content: [
      list(ListType.ORDERED, [
        listItem([
          paragraph([text("Parent")]),
          list(ListType.UNORDERED, [
            listItem([
              paragraph([text("Child")]),
              list(ListType.CHECK, [listItem([paragraph([text("Grandchild")])], true)]),
            ]),
          ]),
        ]),
      ]),
    ],
  },
  {
    name: "list item with multiple blocks",
    content: [
      list(ListType.UNORDERED, [
        listItem([
          paragraph([text("Lead")]),
          heading(3, [text("Sub")]),
          { type: "code", language: "sh", lineNumbers: false, children: [text("ls")] },
          { type: "divider" },
          {
            type: "quote",
            children: [paragraph([text("Nested quote")])],
          },
        ]),
      ]),
    ],
  },
  {
    name: "pending block",
    content: [
      {
        type: "pending",
        children: [
          paragraph([text("Streaming")]),
          heading(2, [text("Soon")]),
          list(ListType.ORDERED, [listItem([paragraph([text("Item")])])]),
          { type: "quote", children: [paragraph([text("Quote")])] },
          { type: "code", language: "", lineNumbers: false, children: [] },
          { type: "divider" },
        ],
      },
    ],
  },
  {
    name: "multiple top-level blocks",
    content: [
      heading(1, [text("Doc")]),
      paragraph([text("Intro")]),
      { type: "divider" },
      list(ListType.UNORDERED, [listItem([paragraph([text("Item")])])]),
      paragraph([text("Outro")]),
    ],
  },
];

const inlineFixtures: Fixture[] = [
  {
    name: "link",
    content: [
      paragraph([
        text("See "),
        { type: "link", href: "https://example.com", children: [text("example")] },
      ]),
    ],
  },
  {
    name: "link with theme and formatted text",
    content: [
      paragraph([
        {
          type: "link",
          href: "https://example.com/a?b=c#d",
          theme: "accent",
          children: [
            text("bold", TextFormat.BOLD),
            text("plain"),
            text("red", 0, { color: COLOR }),
          ],
        },
      ]),
    ],
  },
  { name: "empty link", content: [paragraph([{ type: "link", href: "/", children: [] }])] },
  { name: "date without time", content: [paragraph([date("2026-10-13")])] },
  { name: "date with time", content: [paragraph([date("2026-10-13T09:30:00.000Z")])] },
  { name: "date with theme", content: [paragraph([date("2026-01-01", { theme: "accent" })])] },
  {
    name: "formatted date",
    content: [
      paragraph([
        date("2026-10-13", {
          format: TextFormat.BOLD | TextFormat.ITALIC,
          size: 1.25,
          color: COLOR,
          font: FONT,
        }),
      ]),
    ],
    // y-prosemirror only stores marks on text, so marks on inline atoms do not survive the fragment.
    fragment: [paragraph([date("2026-10-13")])],
  },
  { name: "dropdown", content: [paragraph([dropdown()])] },
  {
    name: "formatted dropdown",
    content: [
      paragraph([
        dropdown({
          dropdownType: "priority",
          value: "High",
          format: TextFormat.UNDERLINE,
          size: 0.5,
        }),
      ]),
    ],
    fragment: [paragraph([dropdown({ dropdownType: "priority", value: "High" })])],
  },
  { name: "mention", content: [paragraph([mention()])] },
  {
    name: "formatted mention",
    content: [
      paragraph([
        mention({
          userId: "user-2",
          displayName: "Grace",
          format: TextFormat.CODE,
          color: COLOR,
          font: FONT,
        }),
      ]),
    ],
    fragment: [paragraph([mention({ userId: "user-2", displayName: "Grace" })])],
  },
  {
    name: "mixed inline content",
    content: [
      paragraph([
        text("Hi "),
        mention(),
        text(", due "),
        date("2026-12-31"),
        text(" ("),
        dropdown(),
        text(") see "),
        { type: "link", href: "https://example.com", children: [text("docs")] },
        text(".", TextFormat.BOLD),
      ]),
    ],
  },
  {
    name: "inline nodes inside a heading",
    content: [heading(2, [text("By "), mention(), text(" on "), date("2026-10-13")])],
  },
];

const styleFixtures: Fixture[] = [
  ...ALIGNMENTS.map(([name, align]): Fixture => ({
    name: `${name} aligned paragraph and heading`,
    content: [paragraph([text("p")], { align }), heading(1, [text("h")], { align })],
  })),
  {
    name: "line height and indent",
    content: [
      paragraph([text("p")], { lineHeight: 1.5, indent: 2 }),
      heading(2, [text("h")], { lineHeight: 3, indent: 6 }),
    ],
  },
  {
    name: "line height without indent",
    content: [paragraph([text("p")], { lineHeight: 1 })],
  },
  {
    name: "indent without line height",
    content: [heading(3, [text("h")], { indent: 1 })],
  },
  {
    name: "all block style properties with a theme",
    content: [
      heading(1, [text("h")], {
        align: TextAlignment.RIGHT,
        lineHeight: 2,
        indent: 3,
        theme: "accent",
      }),
    ],
  },
];

const fixtures: Fixture[] = [
  ...markFixtures,
  ...blockFixtures,
  ...inlineFixtures,
  ...styleFixtures,
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
  test.each(fixtures)("$name", ({ content, fragment }) => {
    const doc = deserialize(content);
    expect(() => doc.check()).not.toThrow();

    const serialized = serializeDoc(doc);
    expect(serialized).toEqual(content);
    expect(deserialize(serialized).eq(doc)).toBe(true);

    expect(serializeFragment(toFragment(doc))).toEqual(fragment ?? content);
  });

  test("fixtures exercise every node and mark type in the schema", () => {
    const nodeNames = new Set<string>();
    const markNames = new Set<string>();
    for (const { content } of fixtures) {
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
        { type: "paragraph", children: [text("p")] },
        { type: "heading", level: 1, children: [text("h")] },
      ],
      output: [paragraph([text("p")]), heading(1, [text("h")])],
    },
    {
      name: "defaults list items to unchecked",
      input: [list(ListType.ORDERED, [{ type: "listitem", children: [paragraph([text("a")])] }])],
      output: [list(ListType.ORDERED, [listItem([paragraph([text("a")])], false)])],
    },
    {
      name: "defaults the date theme to null",
      input: [paragraph([{ type: "date", value: "2026-10-13", format: TextFormat.NONE }])],
      output: [paragraph([date("2026-10-13")])],
    },
    {
      name: "merges adjacent text with identical marks",
      input: [paragraph([text("a", TextFormat.BOLD), text("b", TextFormat.BOLD), text("c")])],
      output: [paragraph([text("ab", TextFormat.BOLD), text("c")])],
    },
    {
      name: "ignores unknown format flags",
      input: [paragraph([text("x", TextFormat.BOLD | (1 << 12))])],
      output: [paragraph([text("x", TextFormat.BOLD)])],
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
    expect(() => deserialize([heading(1, [], { indent: 99 })])).toThrow(RangeError);
    expect(() => deserialize([paragraph([text("x", 0, { color: "red" })])])).toThrow(RangeError);
    expect(() => deserialize([paragraph([text("x", 0, { font: "comic-sans" })])])).toThrow(
      RangeError,
    );
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
    const content: RichText = [
      heading(1, [text("Title", TextFormat.BOLD)]),
      paragraph([
        text("Body "),
        { type: "link", href: "https://example.com", children: [text("link")] },
      ]),
      list(ListType.CHECK, [listItem([paragraph([text("Done")])], true)]),
    ];
    const doc = deserialize(content);
    expect(serializeFragment(toFragment(doc))).toEqual(serializeDoc(doc));
  });
});
