import { describe, expect, test } from "vitest";
import * as Y from "yjs";
import { fragmentToMarkdown, richTextToMarkdown } from "@/markdown/richText";
import { YXmlStreamWriter } from "@/richText/writer";
import { ListType, TextFormat } from "@/types/richText";
import type {
  BlockNode,
  InlineNode,
  ListItemNode,
  ListNode,
  ParagraphNode,
  RichText,
  TextNode,
} from "@/types/richText";

// JSON builders

function t(value: string, format = TextFormat.NONE): TextNode {
  return { type: "text", text: value, format };
}

const p = (...children: InlineNode[]): ParagraphNode => ({ type: "paragraph", children });

const li = (checked: boolean, ...children: BlockNode[]): ListItemNode => ({
  type: "listitem",
  checked,
  children,
});

const list = (listType: ListType, ...children: ListItemNode[]): ListNode => ({
  type: "list",
  listType,
  children,
});

// Y.Xml builders

function fragment(...nodes: (Y.XmlElement | Y.XmlText)[]): Y.XmlFragment {
  const content = new Y.Doc().getXmlFragment("content");
  content.insert(0, nodes);
  return content;
}

function element(
  name: string,
  attrs: Record<string, unknown> = {},
  children: (Y.XmlElement | Y.XmlText)[] = [],
): Y.XmlElement {
  const node = new Y.XmlElement(name);
  for (const [key, value] of Object.entries(attrs)) {
    node.setAttribute(key, value as string);
  }
  if (children.length > 0) {
    node.insert(0, children);
  }
  return node;
}

function text(value: string, attributes?: Record<string, object>): Y.XmlText {
  const node = new Y.XmlText();
  node.insert(0, value, attributes);
  return node;
}

const paragraph = (...children: (Y.XmlElement | Y.XmlText)[]) => element("paragraph", {}, children);

const item = (checked: boolean, ...blocks: Y.XmlElement[]) =>
  element("list_item", { checked }, blocks);

describe("richTextToMarkdown", () => {
  test("returns an empty string for empty input", () => {
    expect(richTextToMarkdown([])).toBe("");
  });

  describe("paragraph", () => {
    test("separates paragraphs with a blank line", () => {
      expect(richTextToMarkdown([p(t("First")), p(t("Second"))])).toBe("First\n\nSecond");
    });

    test("drops empty paragraphs", () => {
      expect(richTextToMarkdown([p(t("First")), p(), p(t("  ")), p(t("Second"))])).toBe(
        "First\n\nSecond",
      );
    });

    test("renders inline marks and escapes text", () => {
      expect(
        richTextToMarkdown([p(t("Plain "), t("bold", TextFormat.BOLD), t(" and *stars*"))]),
      ).toBe("Plain **bold** and \\*stars\\*");
    });

    test("escapes block syntax at the start of a paragraph", () => {
      expect(richTextToMarkdown([p(t("- not a list"))])).toBe("\\- not a list");
    });
  });

  describe("heading", () => {
    test.each([
      [1, "# Title"],
      [2, "## Title"],
      [3, "### Title"],
    ] as const)("renders level %i", (level, expected) => {
      expect(richTextToMarkdown([{ type: "heading", level, children: [t("Title")] }])).toBe(
        expected,
      );
    });

    test("drops an empty heading", () => {
      expect(richTextToMarkdown([{ type: "heading", level: 1, children: [] }, p(t("x"))])).toBe(
        "x",
      );
    });
  });

  describe("list", () => {
    test("renders an unordered list", () => {
      const content = [
        list(ListType.UNORDERED, li(false, p(t("Item 1"))), li(false, p(t("Item 2")))),
      ];
      expect(richTextToMarkdown(content)).toBe("- Item 1\n- Item 2");
    });

    test("numbers an ordered list", () => {
      const content = [list(ListType.ORDERED, li(false, p(t("First"))), li(false, p(t("Second"))))];
      expect(richTextToMarkdown(content)).toBe("1. First\n2. Second");
    });

    test("marks checklist items", () => {
      const content = [list(ListType.CHECK, li(true, p(t("Done"))), li(false, p(t("Todo"))))];
      expect(richTextToMarkdown(content)).toBe("- [x] Done\n- [ ] Todo");
    });

    test("nests a sub-list directly beneath its item", () => {
      const content = [
        list(
          ListType.UNORDERED,
          li(false, p(t("a")), list(ListType.UNORDERED, li(false, p(t("b"))))),
        ),
      ];
      expect(richTextToMarkdown(content)).toBe("- a\n  - b");
    });

    test("indents a list nested in an ordered item to its marker width", () => {
      const content = [
        list(
          ListType.ORDERED,
          li(false, p(t("a")), list(ListType.UNORDERED, li(false, p(t("b"))))),
        ),
      ];
      expect(richTextToMarkdown(content)).toBe("1. a\n   - b");
    });

    test("indents a list nested in a checklist item by two spaces", () => {
      const content = [
        list(ListType.CHECK, li(true, p(t("a")), list(ListType.CHECK, li(false, p(t("b")))))),
      ];
      expect(richTextToMarkdown(content)).toBe("- [x] a\n  - [ ] b");
    });

    test("separates other blocks in an item with a blank line", () => {
      const code: BlockNode = {
        type: "code",
        language: "",
        lineNumbers: false,
        children: [t("x")],
      };
      const content = [list(ListType.UNORDERED, li(false, p(t("a")), code, p(t("b"))))];
      expect(richTextToMarkdown(content)).toBe("- a\n\n  ```\n  x\n  ```\n\n  b");
    });

    test("renders an item without text as a bare marker", () => {
      const content = [list(ListType.UNORDERED, li(false, p()), li(false, p(t("b"))))];
      expect(richTextToMarkdown(content)).toBe("-\n- b");
    });
  });

  describe("code", () => {
    test("fences a code block with its language", () => {
      const code: BlockNode = {
        type: "code",
        language: "javascript",
        lineNumbers: false,
        children: [t("const x = 1;")],
      };
      expect(richTextToMarkdown([code])).toBe("```javascript\nconst x = 1;\n```");
    });

    test("keeps code verbatim and lengthens the fence past any backticks inside", () => {
      const code: BlockNode = {
        type: "code",
        language: "",
        lineNumbers: false,
        children: [t("```md\n*not emphasis*\n```")],
      };
      expect(richTextToMarkdown([code])).toBe("````\n```md\n*not emphasis*\n```\n````");
    });
  });

  describe("quote", () => {
    test("prefixes each line, including the blank lines between blocks", () => {
      const quote: BlockNode = { type: "quote", children: [p(t("Line one")), p(t("Line two"))] };
      expect(richTextToMarkdown([quote])).toBe("> Line one\n>\n> Line two");
    });

    test("drops an empty quote", () => {
      expect(richTextToMarkdown([{ type: "quote", children: [p()] }, p(t("x"))])).toBe("x");
    });
  });

  test("renders a divider between paragraphs", () => {
    expect(richTextToMarkdown([p(t("Before")), { type: "divider" }, p(t("After"))])).toBe(
      "Before\n\n---\n\nAfter",
    );
  });

  test("renders the blocks of a pending block in place", () => {
    const pending: BlockNode = { type: "pending", children: [p(t("a")), p(t("b"))] };
    expect(richTextToMarkdown([pending, p(t("c"))])).toBe("a\n\nb\n\nc");
  });

  describe("tile", () => {
    const content: RichText = [p(t("Before")), { type: "tile", id: "tile-1" }, p(t("After"))];

    test("throws for an embedded tile without a resolver", () => {
      expect(() => richTextToMarkdown(content)).toThrow("Embedded tiles need a tile serializer");
    });

    test("inlines resolved tile content at its position", () => {
      expect(richTextToMarkdown(content, { tile: (id) => `![${id}]` })).toBe(
        "Before\n\n![tile-1]\n\nAfter",
      );
    });

    test("omits tiles the resolver leaves empty", () => {
      expect(richTextToMarkdown(content, { tile: () => "" })).toBe("Before\n\nAfter");
    });

    test("indents a tile nested in a list item", () => {
      const nested = [
        list(ListType.UNORDERED, li(false, p(t("Item")), { type: "tile", id: "t2" })),
      ];
      expect(richTextToMarkdown(nested, { tile: () => "| a |\n| --- |" })).toBe(
        "- Item\n\n  | a |\n  | --- |",
      );
    });

    test("prefixes a tile nested in a quote", () => {
      const quote: BlockNode = {
        type: "quote",
        children: [p(t("Quoted")), { type: "tile", id: "t1" }],
      };
      expect(richTextToMarkdown([quote], { tile: () => "| a |" })).toBe("> Quoted\n>\n> | a |");
    });
  });
});

describe("fragmentToMarkdown", () => {
  test("returns an empty string for an empty fragment", () => {
    expect(fragmentToMarkdown(fragment())).toBe("");
  });

  test("serializes inline marks", () => {
    const styled = new Y.XmlText();
    styled.insert(0, "Plain ");
    styled.insert(6, "bold", { bold: {} });
    styled.insert(10, " and ", { bold: null });
    styled.insert(15, "italic", { italic: {} });
    expect(fragmentToMarkdown(fragment(paragraph(styled)))).toBe("Plain **bold** and *italic*");
  });

  test("serializes headings, lists and inline elements", () => {
    const link = element("link", { href: "https://example.com" }, [text("Example")]);
    const mention = element("mention", { userId: "u1", displayName: "Alice" });
    const date = element("date", { value: "2024-01-15T00:00", time: false });
    const content = fragment(
      element("heading", { level: 2 }, [text("Title")]),
      element("check_list", {}, [item(true, paragraph(text("Done ("), date, text(")")))]),
      paragraph(text("See "), link, text(" with "), mention),
    );
    expect(fragmentToMarkdown(content)).toBe(
      "## Title\n\n- [x] Done (2024-01-15)\n\nSee [Example](https://example.com) with @Alice",
    );
  });

  test("inlines resolved tiles", () => {
    const content = fragment(paragraph(text("Before")), element("tile", { id: "t1" }));
    expect(fragmentToMarkdown(content, { tile: (id) => `![image ${id}]` })).toBe(
      "Before\n\n![image t1]",
    );
  });

  test("serializes fragments produced by YXmlStreamWriter", () => {
    const content = new Y.Doc().getXmlFragment("content");
    const writer = new YXmlStreamWriter(content, "append");
    writer.apply({ type: "heading", level: 1 });
    writer.apply("Title");
    writer.apply({ type: "paragraph" });
    writer.apply("Body ");
    writer.apply({ bold: true });
    writer.apply("text");

    expect(fragmentToMarkdown(content)).toBe("# Title\n\nBody **text**");
  });
});
