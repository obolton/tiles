import { describe, expect, test } from "vitest";
import * as Y from "yjs";
import { fragmentToMarkdown } from "@/richText/markdown";
import { YXmlStreamWriter } from "@/richText/writer";

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
  element("paragraph", {}, children);

const item = (checked: boolean, ...blocks: Y.XmlElement[]) =>
  element("list_item", { checked }, blocks);

describe("fragmentToMarkdown", () => {
  test("returns an empty string for an empty fragment", () => {
    expect(fragmentToMarkdown(fragment())).toBe("");
  });

  describe("paragraph", () => {
    test("serializes a single paragraph", () => {
      expect(fragmentToMarkdown(fragment(paragraph(text("Hello world"))))).toBe(
        "Hello world",
      );
    });

    test("separates multiple paragraphs with a blank line", () => {
      expect(
        fragmentToMarkdown(
          fragment(paragraph(text("First")), paragraph(text("Second"))),
        ),
      ).toBe("First\n\nSecond");
    });

    test("ignores inline marks", () => {
      const styled = new Y.XmlText();
      styled.insert(0, "Plain ");
      styled.insert(6, "bold", { bold: {} });
      styled.insert(10, " and ");
      styled.insert(15, "italic", { italic: {} });
      expect(
        fragmentToMarkdown(fragment(element("paragraph", {}, [styled]))),
      ).toBe("Plain bold and italic");
    });
  });

  describe("heading", () => {
    test.each([
      [1, "# Title"],
      [2, "## Title"],
      [3, "### Title"],
    ])("serializes level %i", (level, expected) => {
      expect(
        fragmentToMarkdown(
          fragment(element("heading", { level }, [text("Title")])),
        ),
      ).toBe(expected);
    });
  });

  describe("list", () => {
    test("serializes an unordered list", () => {
      const list = element("unordered_list", {}, [
        item(false, paragraph(text("Item 1"))),
        item(false, paragraph(text("Item 2"))),
      ]);
      expect(fragmentToMarkdown(fragment(list))).toBe("- Item 1\n- Item 2");
    });

    test("numbers an ordered list", () => {
      const list = element("ordered_list", { order: 1 }, [
        item(false, paragraph(text("First"))),
        item(false, paragraph(text("Second"))),
      ]);
      expect(fragmentToMarkdown(fragment(list))).toBe("1. First\n2. Second");
    });

    test("marks checklist items", () => {
      const list = element("check_list", {}, [
        item(true, paragraph(text("Done"))),
        item(false, paragraph(text("Todo"))),
      ]);
      expect(fragmentToMarkdown(fragment(list))).toBe("- [x] Done\n- [ ] Todo");
    });

    test("nests a sub-list beneath its item", () => {
      const list = element("unordered_list", {}, [
        item(
          false,
          paragraph(text("a")),
          element("unordered_list", {}, [item(false, paragraph(text("b")))]),
        ),
      ]);
      expect(fragmentToMarkdown(fragment(list))).toBe("- a\n  - b");
    });

    test("indents a nested list to its marker width", () => {
      const list = element("ordered_list", { order: 1 }, [
        item(
          false,
          paragraph(text("a")),
          element("unordered_list", {}, [item(false, paragraph(text("b")))]),
        ),
      ]);
      expect(fragmentToMarkdown(fragment(list))).toBe("1. a\n   - b");
    });
  });

  describe("code", () => {
    test("fences a code block with its language", () => {
      const code = element("codeBlock", { language: "javascript" }, [
        text("const x = 1;"),
      ]);
      expect(fragmentToMarkdown(fragment(code))).toBe(
        "```javascript\nconst x = 1;\n```",
      );
    });

    test("fences a code block without a language", () => {
      const code = element("codeBlock", { language: "" }, [text("some code")]);
      expect(fragmentToMarkdown(fragment(code))).toBe("```\nsome code\n```");
    });
  });

  describe("quote", () => {
    test("prefixes each line", () => {
      const quote = element("quote", {}, [
        paragraph(text("Line one")),
        paragraph(text("Line two")),
      ]);
      expect(fragmentToMarkdown(fragment(quote))).toBe(
        "> Line one\n> \n> Line two",
      );
    });
  });

  describe("divider", () => {
    test("serializes a divider between paragraphs", () => {
      expect(
        fragmentToMarkdown(
          fragment(
            paragraph(text("Before")),
            element("divider"),
            paragraph(text("After")),
          ),
        ),
      ).toBe("Before\n\n---\n\nAfter");
    });
  });

  describe("inline nodes", () => {
    test("serializes a link", () => {
      const link = element("link", { href: "https://example.com" }, [
        text("Example"),
      ]);
      expect(fragmentToMarkdown(fragment(paragraph(link)))).toBe(
        "[Example](https://example.com)",
      );
    });

    test("serializes inline nodes mixed with text", () => {
      const link = element("link", { href: "https://example.com" }, [
        text("Example"),
      ]);
      expect(
        fragmentToMarkdown(
          fragment(paragraph(text("See "), link, text(" for more"))),
        ),
      ).toBe("See [Example](https://example.com) for more");
    });

    test("serializes a mention", () => {
      const mention = element("mention", {
        userId: "u1",
        displayName: "Alice",
      });
      expect(fragmentToMarkdown(fragment(paragraph(mention)))).toBe("@Alice");
    });

    test("keeps the full value of a date with a time", () => {
      const date = element("date", { value: "2024-01-15T09:30", time: true });
      expect(fragmentToMarkdown(fragment(paragraph(date)))).toBe(
        "2024-01-15T09:30",
      );
    });

    test("truncates a date without a time to the day", () => {
      const date = element("date", { value: "2024-01-15T00:00", time: false });
      expect(fragmentToMarkdown(fragment(paragraph(date)))).toBe("2024-01-15");
    });

    test("serializes a dropdown value", () => {
      const dropdown = element("dropdown", {
        dropdownType: "status",
        value: "In Progress",
      });
      expect(fragmentToMarkdown(fragment(paragraph(dropdown)))).toBe(
        "In Progress",
      );
    });
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

    expect(fragmentToMarkdown(content)).toBe("# Title\n\nBody text");
  });
});
