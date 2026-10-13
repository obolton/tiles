import { ListType, TextAlignment, TextFormat } from "@/utils/richText/types";
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
} from "@/utils/richText/types";

export const COLOR = "ff0000ff0000";
export const FONT = "lora";

// Builders fill in the values the schema defaults produce after a round trip.
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

function listItem(children: BlockNode[], checked = false): ListItemNode {
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

const EVERY_FORMAT =
  TextFormat.BOLD |
  TextFormat.ITALIC |
  TextFormat.STRIKETHROUGH |
  TextFormat.UNDERLINE |
  TextFormat.HIGHLIGHT |
  TextFormat.SUPERSCRIPT |
  TextFormat.SMALL_CAPS |
  TextFormat.CODE;

export const MARK_DOCUMENTS = {
  "bold text": [paragraph([text("plain"), text("bold", TextFormat.BOLD), text("plain again")])],
  "italic text": [paragraph([text("plain"), text("italic", TextFormat.ITALIC)])],
  "underlined text": [paragraph([text("plain"), text("underline", TextFormat.UNDERLINE)])],
  "strikethrough text": [paragraph([text("plain"), text("struck", TextFormat.STRIKETHROUGH)])],
  "highlighted text": [paragraph([text("plain"), text("highlight", TextFormat.HIGHLIGHT)])],
  "superscript text": [paragraph([text("plain"), text("sup", TextFormat.SUPERSCRIPT)])],
  "subscript text": [paragraph([text("plain"), text("sub", TextFormat.SUBSCRIPT)])],
  "small caps text": [paragraph([text("plain"), text("caps", TextFormat.SMALL_CAPS)])],
  "code text": [paragraph([text("plain"), text("code", TextFormat.CODE)])],
  "text size": [paragraph([text("big", TextFormat.NONE, { size: 1.5 })])],
  "text color": [paragraph([text("red", TextFormat.NONE, { color: COLOR })])],
  "text font": [paragraph([text("serif", TextFormat.NONE, { font: FONT })])],
  "every format flag and attribute mark on one text node": [
    paragraph([
      text("everything", EVERY_FORMAT, { size: 0.75, color: COLOR, font: FONT }),
      text("subscript", TextFormat.SUBSCRIPT | TextFormat.BOLD, { size: 2.5 }),
    ]),
  ],
} satisfies Record<string, RichText>;

export const BLOCK_DOCUMENTS = {
  "empty paragraph": [paragraph([])],
  "whitespace-only text": [paragraph([text("   ")])],
  "heading level 1": [heading(1, [text("Title")])],
  "heading level 2": [heading(2, [text("Title")])],
  "heading level 3": [heading(3, [text("Title")])],
  "heading with theme": [heading(1, [text("Title")], { theme: "accent" })],
  "empty heading": [heading(2, [])],
  "quote containing every allowed block": [
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
  "code block with language and line numbers": [
    {
      type: "code",
      language: "typescript",
      lineNumbers: true,
      children: [text("function add(a: number) {\n  return a + 1;\n}\n")],
    },
  ],
  "empty code block": [{ type: "code", language: "", lineNumbers: false, children: [] }],
  divider: [{ type: "divider" }],
  "ordered list": [
    list(ListType.ORDERED, [
      listItem([paragraph([text("One")])]),
      listItem([paragraph([text("Two")])]),
    ]),
  ],
  "unordered list": [list(ListType.UNORDERED, [listItem([paragraph([text("Bullet")])])])],
  "check list with checked and unchecked items": [
    list(ListType.CHECK, [
      listItem([paragraph([text("Done")])], true),
      listItem([paragraph([text("Todo")])], false),
    ]),
  ],
  "nested lists": [
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
  "list item with multiple blocks": [
    list(ListType.UNORDERED, [
      listItem([
        paragraph([text("Lead")]),
        heading(3, [text("Sub")]),
        { type: "code", language: "sh", lineNumbers: false, children: [text("ls")] },
        { type: "divider" },
        { type: "quote", children: [paragraph([text("Nested quote")])] },
      ]),
    ]),
  ],
  "pending block": [
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
  "multiple top-level blocks": [
    heading(1, [text("Doc")]),
    paragraph([text("Intro")]),
    { type: "divider" },
    list(ListType.UNORDERED, [listItem([paragraph([text("Item")])])]),
    paragraph([text("Outro")]),
  ],
} satisfies Record<string, RichText>;

export const INLINE_DOCUMENTS = {
  link: [
    paragraph([
      text("See "),
      { type: "link", href: "https://example.com", children: [text("example")] },
    ]),
  ],
  "link with theme and formatted text": [
    paragraph([
      {
        type: "link",
        href: "https://example.com/a?b=c#d",
        theme: "accent",
        children: [text("bold", TextFormat.BOLD), text("plain"), text("red", 0, { color: COLOR })],
      },
    ]),
  ],
  "empty link": [paragraph([{ type: "link", href: "/", children: [] }])],
  "date without time": [paragraph([date("2026-10-13")])],
  "date with time": [paragraph([date("2026-10-13T09:30:00.000Z")])],
  "date with theme": [paragraph([date("2026-01-01", { theme: "accent" })])],
  "formatted date": [
    paragraph([
      date("2026-10-13", {
        format: TextFormat.BOLD | TextFormat.ITALIC,
        size: 1.25,
        color: COLOR,
        font: FONT,
      }),
    ]),
  ],
  dropdown: [paragraph([dropdown()])],
  "formatted dropdown": [
    paragraph([
      dropdown({
        dropdownType: "priority",
        value: "High",
        format: TextFormat.UNDERLINE,
        size: 0.5,
      }),
    ]),
  ],
  mention: [paragraph([mention()])],
  "formatted mention": [
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
  "mixed inline content": [
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
  "inline nodes inside a heading": [
    heading(2, [text("By "), mention(), text(" on "), date("2026-10-13")]),
  ],
} satisfies Record<string, RichText>;

export const STYLE_DOCUMENTS = {
  "left aligned paragraph and heading": [
    paragraph([text("p")], { align: TextAlignment.LEFT }),
    heading(1, [text("h")], { align: TextAlignment.LEFT }),
  ],
  "center aligned paragraph and heading": [
    paragraph([text("p")], { align: TextAlignment.CENTER }),
    heading(1, [text("h")], { align: TextAlignment.CENTER }),
  ],
  "right aligned paragraph and heading": [
    paragraph([text("p")], { align: TextAlignment.RIGHT }),
    heading(1, [text("h")], { align: TextAlignment.RIGHT }),
  ],
  "justified paragraph and heading": [
    paragraph([text("p")], { align: TextAlignment.JUSTIFY }),
    heading(1, [text("h")], { align: TextAlignment.JUSTIFY }),
  ],
  "line height and indent": [
    paragraph([text("p")], { lineHeight: 1.5, indent: 2 }),
    heading(2, [text("h")], { lineHeight: 3, indent: 6 }),
  ],
  "line height without indent": [paragraph([text("p")], { lineHeight: 1 })],
  "indent without line height": [heading(3, [text("h")], { indent: 1 })],
  "all block style properties with a theme": [
    heading(1, [text("h")], {
      align: TextAlignment.RIGHT,
      lineHeight: 2,
      indent: 3,
      theme: "accent",
    }),
  ],
} satisfies Record<string, RichText>;

/**
 * Rich text documents that together exercise every node and mark type in the schema.
 * Each value is the canonical form produced by a serialize/deserialize round trip.
 */
export const RICH_TEXT_DOCUMENTS = {
  ...MARK_DOCUMENTS,
  ...BLOCK_DOCUMENTS,
  ...INLINE_DOCUMENTS,
  ...STYLE_DOCUMENTS,
} satisfies Record<string, RichText>;
