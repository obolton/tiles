import { describe, expect, test } from "vitest";
import * as Y from "yjs";
import { fragmentToRichText } from "@/richText/serialize";
import { YXmlStreamWriter } from "@/richText/writer";
import { ListType, TextAlignment, TextFormat } from "@/types/richText";

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

const paragraph = (...children: (Y.XmlElement | Y.XmlText)[]) =>
  element("paragraph", { align: "left" }, children);

const plain = (value: string) => ({ type: "text", text: value, format: TextFormat.NONE });

const item = (checked: boolean | undefined, ...blocks: Y.XmlElement[]) =>
  element("list_item", checked === undefined ? {} : { checked }, blocks);

describe("fragmentToRichText", () => {
  test("returns an empty array for an empty fragment", () => {
    expect(fragmentToRichText(fragment())).toEqual([]);
  });

  test("skips unknown block elements and loose text", () => {
    expect(fragmentToRichText(fragment(element("unknown"), text("loose")))).toEqual([]);
  });

  describe("paragraph", () => {
    test("converts text with its block style", () => {
      const node = element("paragraph", { align: "center", lineHeight: 1.5, indent: 2 }, [
        text("Hello"),
      ]);
      expect(fragmentToRichText(fragment(node))).toEqual([
        {
          type: "paragraph",
          align: TextAlignment.CENTER,
          lineHeight: 1.5,
          indent: 2,
          children: [plain("Hello")],
        },
      ]);
    });

    test("omits a missing or unknown alignment", () => {
      expect(fragmentToRichText(fragment(element("paragraph", { align: "wide" })))).toEqual([
        { type: "paragraph", children: [] },
      ]);
    });
  });

  describe("heading", () => {
    test("keeps the level and theme", () => {
      const node = element("heading", { level: 2, align: "left", theme: "accent" }, [
        text("Title"),
      ]);
      expect(fragmentToRichText(fragment(node))).toEqual([
        {
          type: "heading",
          level: 2,
          align: TextAlignment.LEFT,
          theme: "accent",
          children: [plain("Title")],
        },
      ]);
    });

    test("falls back to level 1 for an invalid level", () => {
      expect(fragmentToRichText(fragment(element("heading", { level: 7 })))).toEqual([
        { type: "heading", level: 1, children: [] },
      ]);
    });
  });

  describe("marks", () => {
    test.each([
      ["bold", TextFormat.BOLD],
      ["italic", TextFormat.ITALIC],
      ["strikethrough", TextFormat.STRIKETHROUGH],
      ["underline", TextFormat.UNDERLINE],
      ["highlight", TextFormat.HIGHLIGHT],
      ["superscript", TextFormat.SUPERSCRIPT],
      ["subscript", TextFormat.SUBSCRIPT],
      ["smallCaps", TextFormat.SMALL_CAPS],
      ["code", TextFormat.CODE],
    ])("maps the %s mark to its format flag", (mark, format) => {
      const content = fragmentToRichText(fragment(paragraph(text("x", { [mark]: {} }))));
      expect(content).toEqual([
        { type: "paragraph", align: TextAlignment.LEFT, children: [{ ...plain("x"), format }] },
      ]);
    });

    test("combines several marks into one format value", () => {
      const styled = text("x", { bold: {}, italic: {}, code: {} });
      expect(fragmentToRichText(fragment(paragraph(styled)))).toEqual([
        {
          type: "paragraph",
          align: TextAlignment.LEFT,
          children: [
            { ...plain("x"), format: TextFormat.BOLD | TextFormat.ITALIC | TextFormat.CODE },
          ],
        },
      ]);
    });

    test("copies the size, color and font attributes", () => {
      const styled = text("x", {
        size: { size: 1.5 },
        color: { color: "ff0000ff0000" },
        font: { font: "lora" },
      });
      expect(fragmentToRichText(fragment(paragraph(styled)))).toEqual([
        {
          type: "paragraph",
          align: TextAlignment.LEFT,
          children: [{ ...plain("x"), size: 1.5, color: "ff0000ff0000", font: "lora" }],
        },
      ]);
    });

    test("strips the hash y-prosemirror adds to overlapping mark keys", () => {
      const styled = text("x", { "bold--AbCdEf12": {}, "size--Zz99+/==": { size: 2 } });
      expect(fragmentToRichText(fragment(paragraph(styled)))).toEqual([
        {
          type: "paragraph",
          align: TextAlignment.LEFT,
          children: [{ ...plain("x"), format: TextFormat.BOLD, size: 2 }],
        },
      ]);
    });

    test("ignores unknown marks and malformed attribute values", () => {
      const styled = text("x", { glow: {}, size: { size: "big" } });
      expect(fragmentToRichText(fragment(paragraph(styled)))).toEqual([
        { type: "paragraph", align: TextAlignment.LEFT, children: [plain("x")] },
      ]);
    });

    test("keeps separate runs for differently marked text", () => {
      const styled = new Y.XmlText();
      styled.insert(0, "Plain ");
      styled.insert(6, "bold", { bold: {} });
      styled.insert(10, " and ", { bold: null });
      styled.insert(15, "italic", { italic: {} });
      expect(fragmentToRichText(fragment(paragraph(styled)))).toEqual([
        {
          type: "paragraph",
          align: TextAlignment.LEFT,
          children: [
            plain("Plain "),
            { ...plain("bold"), format: TextFormat.BOLD },
            plain(" and "),
            { ...plain("italic"), format: TextFormat.ITALIC },
          ],
        },
      ]);
    });
  });

  describe("list", () => {
    test.each([
      ["ordered_list", ListType.ORDERED],
      ["unordered_list", ListType.UNORDERED],
      ["check_list", ListType.CHECK],
    ])("converts a %s", (name, listType) => {
      const list = element(name, {}, [
        item(true, paragraph(text("Done"))),
        item(undefined, paragraph(text("Todo"))),
      ]);
      expect(fragmentToRichText(fragment(list))).toEqual([
        {
          type: "list",
          listType,
          children: [
            {
              type: "listitem",
              checked: true,
              children: [
                { type: "paragraph", align: TextAlignment.LEFT, children: [plain("Done")] },
              ],
            },
            {
              type: "listitem",
              checked: false,
              children: [
                { type: "paragraph", align: TextAlignment.LEFT, children: [plain("Todo")] },
              ],
            },
          ],
        },
      ]);
    });

    test("nests blocks within an item and skips other children", () => {
      const list = element("unordered_list", {}, [
        item(
          false,
          paragraph(text("a")),
          element("unordered_list", {}, [item(false, paragraph(text("b")))]),
        ),
        paragraph(text("stray")),
      ]);
      expect(fragmentToRichText(fragment(list))).toEqual([
        {
          type: "list",
          listType: ListType.UNORDERED,
          children: [
            {
              type: "listitem",
              checked: false,
              children: [
                { type: "paragraph", align: TextAlignment.LEFT, children: [plain("a")] },
                {
                  type: "list",
                  listType: ListType.UNORDERED,
                  children: [
                    {
                      type: "listitem",
                      checked: false,
                      children: [
                        { type: "paragraph", align: TextAlignment.LEFT, children: [plain("b")] },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        },
      ]);
    });
  });

  describe("other blocks", () => {
    test("converts a quote with its blocks", () => {
      const quote = element("quote", {}, [paragraph(text("Quoted")), element("divider")]);
      expect(fragmentToRichText(fragment(quote))).toEqual([
        {
          type: "quote",
          children: [
            { type: "paragraph", align: TextAlignment.LEFT, children: [plain("Quoted")] },
            { type: "divider" },
          ],
        },
      ]);
    });

    test("converts a pending block with its blocks", () => {
      const pending = element("pending", {}, [paragraph(text("Streaming"))]);
      expect(fragmentToRichText(fragment(pending))).toEqual([
        {
          type: "pending",
          children: [
            { type: "paragraph", align: TextAlignment.LEFT, children: [plain("Streaming")] },
          ],
        },
      ]);
    });

    test("converts a code block, keeping its text verbatim", () => {
      const code = element("codeBlock", { language: "ts", lineNumbers: true }, [
        text("const x = 1;\nconst y = 2;"),
      ]);
      expect(fragmentToRichText(fragment(code))).toEqual([
        {
          type: "code",
          language: "ts",
          lineNumbers: true,
          children: [plain("const x = 1;\nconst y = 2;")],
        },
      ]);
    });

    test("defaults a code block's language and line numbers", () => {
      expect(fragmentToRichText(fragment(element("codeBlock")))).toEqual([
        { type: "code", language: "", lineNumbers: false, children: [] },
      ]);
    });

    test("converts a divider and an embedded tile", () => {
      expect(
        fragmentToRichText(fragment(element("divider"), element("tile", { id: "t1" }))),
      ).toEqual([{ type: "divider" }, { type: "tile", id: "t1" }]);
    });

    test("skips a tile without an id", () => {
      expect(fragmentToRichText(fragment(element("tile")))).toEqual([]);
    });
  });

  describe("inline elements", () => {
    test("converts a link with its text and theme", () => {
      const link = element("link", { href: "https://example.com", theme: "button" }, [
        text("Example", { bold: {} }),
      ]);
      expect(fragmentToRichText(fragment(paragraph(text("See "), link)))).toEqual([
        {
          type: "paragraph",
          align: TextAlignment.LEFT,
          children: [
            plain("See "),
            {
              type: "link",
              href: "https://example.com",
              theme: "button",
              children: [{ ...plain("Example"), format: TextFormat.BOLD }],
            },
          ],
        },
      ]);
    });

    test("keeps the full value of a date with a time", () => {
      const date = element("date", { value: "2024-01-15T09:30", time: true });
      expect(fragmentToRichText(fragment(paragraph(date)))).toEqual([
        {
          type: "paragraph",
          align: TextAlignment.LEFT,
          children: [
            { type: "date", value: "2024-01-15T09:30", format: TextFormat.NONE, theme: null },
          ],
        },
      ]);
    });

    test("truncates a date without a time to the day and keeps its theme", () => {
      const date = element("date", { value: "2024-01-15T00:00", time: false, theme: "accent" });
      expect(fragmentToRichText(fragment(paragraph(date)))).toEqual([
        {
          type: "paragraph",
          align: TextAlignment.LEFT,
          children: [
            { type: "date", value: "2024-01-15", format: TextFormat.NONE, theme: "accent" },
          ],
        },
      ]);
    });

    test("converts a dropdown and a mention", () => {
      const dropdown = element("dropdown", { dropdownType: "status", value: "Done" });
      const mention = element("mention", { userId: "u1", displayName: "Alice" });
      expect(fragmentToRichText(fragment(paragraph(dropdown, mention)))).toEqual([
        {
          type: "paragraph",
          align: TextAlignment.LEFT,
          children: [
            { type: "dropdown", dropdownType: "status", value: "Done", format: TextFormat.NONE },
            { type: "mention", userId: "u1", displayName: "Alice", format: TextFormat.NONE },
          ],
        },
      ]);
    });

    test("skips unknown inline elements", () => {
      expect(fragmentToRichText(fragment(paragraph(element("emoji"), text("x"))))).toEqual([
        { type: "paragraph", align: TextAlignment.LEFT, children: [plain("x")] },
      ]);
    });
  });

  test("converts fragments produced by YXmlStreamWriter", () => {
    const content = new Y.Doc().getXmlFragment("content");
    const writer = new YXmlStreamWriter(content, "append");
    writer.apply({ type: "heading", level: 1 });
    writer.apply("Title");
    writer.apply({ type: "listitem", listType: "unordered", depth: 0 });
    writer.apply("Body ");
    writer.apply({ bold: true });
    writer.apply("text");

    expect(fragmentToRichText(content)).toEqual([
      { type: "heading", level: 1, align: TextAlignment.LEFT, children: [plain("Title")] },
      {
        type: "list",
        listType: ListType.UNORDERED,
        children: [
          {
            type: "listitem",
            checked: false,
            children: [
              {
                type: "paragraph",
                align: TextAlignment.LEFT,
                children: [plain("Body "), { ...plain("text"), format: TextFormat.BOLD }],
              },
            ],
          },
        ],
      },
    ]);
  });
});
