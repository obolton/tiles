import { describe, expect, test } from "vitest";
import { codeSpan, escapeText, inlineToMarkdown, longestRun } from "@/markdown/inline";
import { TextFormat } from "@/types/richText";
import type { InlineNode, TextNode } from "@/types/richText";

function text(value: string, format = TextFormat.NONE, rest: Partial<TextNode> = {}): TextNode {
  return { type: "text", text: value, format, ...rest };
}

const link = (href: string, ...children: TextNode[]): InlineNode => ({
  type: "link",
  href,
  children,
});

describe("inlineToMarkdown", () => {
  test("returns plain text unchanged", () => {
    expect(inlineToMarkdown([text("Hello world")])).toBe("Hello world");
  });

  test("returns an empty string for no nodes", () => {
    expect(inlineToMarkdown([])).toBe("");
  });

  test.each([
    [TextFormat.BOLD, "**x**"],
    [TextFormat.ITALIC, "*x*"],
    [TextFormat.STRIKETHROUGH, "~~x~~"],
    [TextFormat.UNDERLINE, "<u>x</u>"],
    [TextFormat.HIGHLIGHT, "<mark>x</mark>"],
    [TextFormat.SUPERSCRIPT, "<sup>x</sup>"],
    [TextFormat.SUBSCRIPT, "<sub>x</sub>"],
    [TextFormat.CODE, "`x`"],
  ])("renders format %i as %s", (format, expected) => {
    expect(inlineToMarkdown([text("x", format)])).toBe(expected);
  });

  test("drops small caps, size, colour and font", () => {
    const styled = text("x", TextFormat.SMALL_CAPS, {
      size: 2,
      color: "ff0000ff0000",
      font: "lora",
    });
    expect(inlineToMarkdown([styled])).toBe("x");
  });

  test("wraps HTML marks outside the delimiters", () => {
    expect(inlineToMarkdown([text("x", TextFormat.BOLD | TextFormat.UNDERLINE)])).toBe(
      "<u>**x**</u>",
    );
  });

  test("renders a code span inside other marks", () => {
    expect(inlineToMarkdown([text("x", TextFormat.BOLD | TextFormat.CODE)])).toBe("**`x`**");
  });

  test("changes only the marks that differ between runs", () => {
    const nodes = [text("a ", TextFormat.BOLD), text("b", TextFormat.BOLD | TextFormat.ITALIC)];
    expect(inlineToMarkdown(nodes)).toBe("**a *b***");
  });

  test("closes inner marks before opening an outer one", () => {
    const nodes = [text("a", TextFormat.BOLD), text("b", TextFormat.BOLD | TextFormat.UNDERLINE)];
    expect(inlineToMarkdown(nodes)).toBe("**a**<u>**b**</u>");
  });

  test("merges adjacent runs with the same marks", () => {
    expect(inlineToMarkdown([text("a", TextFormat.BOLD), text("b", TextFormat.BOLD)])).toBe(
      "**ab**",
    );
  });

  describe("whitespace", () => {
    test("keeps the whitespace at the edges of a run outside its delimiters", () => {
      expect(inlineToMarkdown([text(" bold ", TextFormat.BOLD)])).toBe(" **bold** ");
    });

    test("separates differently marked runs across their whitespace", () => {
      const nodes = [text("bold ", TextFormat.BOLD), text("italic", TextFormat.ITALIC)];
      expect(inlineToMarkdown(nodes)).toBe("**bold** *italic*");
    });

    test("keeps whitespace inside a span its neighbours share", () => {
      const nodes = [text("a", TextFormat.BOLD), text(" "), text("b", TextFormat.BOLD)];
      expect(inlineToMarkdown(nodes)).toBe("**a b**");
    });

    test("renders a marked whitespace-only run as plain whitespace", () => {
      expect(inlineToMarkdown([text("a"), text(" ", TextFormat.BOLD), text("b")])).toBe("a b");
    });
  });

  test("skips pending text", () => {
    expect(inlineToMarkdown([text("a"), text("b", TextFormat.NONE, { pending: true })])).toBe("a");
  });

  test("renders dates, dropdown values and mentions as escaped text", () => {
    const nodes: InlineNode[] = [
      { type: "date", value: "2024-01-15", format: TextFormat.NONE },
      text(" "),
      { type: "dropdown", dropdownType: "status", value: "*Done*", format: TextFormat.NONE },
      text(" "),
      { type: "mention", userId: "u1", displayName: "Alice", format: TextFormat.BOLD },
    ];
    expect(inlineToMarkdown(nodes)).toBe("2024-01-15 \\*Done\\* **@Alice**");
  });

  describe("link", () => {
    test("renders a link", () => {
      expect(inlineToMarkdown([link("https://example.com", text("Example"))])).toBe(
        "[Example](https://example.com)",
      );
    });

    test("renders marks within the link text", () => {
      expect(inlineToMarkdown([link("/a", text("Bold", TextFormat.BOLD))])).toBe("[**Bold**](/a)");
    });

    test("falls back to the escaped destination for an empty link", () => {
      expect(inlineToMarkdown([link("https://example.com/~a")])).toBe(
        "[https://example.com/\\~a](https://example.com/~a)",
      );
    });

    test("wraps a destination with whitespace in angle brackets", () => {
      expect(inlineToMarkdown([link("/my page", text("x"))])).toBe("[x](</my page>)");
    });

    test("escapes parentheses in a destination", () => {
      expect(inlineToMarkdown([link("https://en.wikipedia.org/wiki/Tile_(a)", text("x"))])).toBe(
        "[x](https://en.wikipedia.org/wiki/Tile_\\(a\\))",
      );
    });

    test("keeps surrounding marks outside the link", () => {
      const nodes = [text("see ", TextFormat.BOLD), link("/a", text("here")), text("!")];
      expect(inlineToMarkdown(nodes)).toBe("**see** [here](/a)!");
    });
  });
});

describe("escapeText", () => {
  test("escapes characters that would be read as Markdown", () => {
    expect(escapeText("a\\b`c*d[e]f<g>h~i")).toBe("a\\\\b\\`c\\*d\\[e\\]f\\<g>h\\~i");
  });

  test("keeps underscores inside words and escapes the rest", () => {
    expect(escapeText("snake_case _emphasis_ a_1")).toBe("snake_case \\_emphasis\\_ a_1");
  });

  test("escapes ampersands only where they would form an entity", () => {
    expect(escapeText("fish & chips &amp; &#39;")).toBe("fish & chips \\&amp; \\&#39;");
  });

  describe("at the start of a line", () => {
    test.each([
      ["# Heading", "\\# Heading"],
      ["## Heading", "\\## Heading"],
      ["#hashtag", "#hashtag"],
      ["> quote", "\\> quote"],
      [">quote", "\\>quote"],
      ["- item", "\\- item"],
      ["+ item", "\\+ item"],
      ["-5 degrees", "-5 degrees"],
      ["1. step", "1\\. step"],
      ["2) step", "2\\) step"],
      ["1.5 ratio", "1.5 ratio"],
      ["---", "\\---"],
      ["- - -", "\\- - -"],
      ["  # indented", "  \\# indented"],
    ])("escapes %j as %j", (input, expected) => {
      expect(escapeText(input, true)).toBe(expected);
    });

    test("leaves block syntax alone elsewhere", () => {
      expect(escapeText("# not a heading")).toBe("# not a heading");
    });
  });
});

describe("codeSpan", () => {
  test("returns an empty string for empty text", () => {
    expect(codeSpan("")).toBe("");
  });

  test("fences text with single backticks", () => {
    expect(codeSpan("x")).toBe("`x`");
  });

  test("uses a longer fence than any backtick run inside", () => {
    expect(codeSpan("a``b")).toBe("```a``b```");
  });

  test("pads text that starts or ends with a backtick", () => {
    expect(codeSpan("`a")).toBe("`` `a ``");
  });

  test("pads text that starts and ends with a space", () => {
    expect(codeSpan(" a ")).toBe("`  a  `");
  });

  test("does not pad whitespace-only text", () => {
    expect(codeSpan("  ")).toBe("`  `");
  });
});

describe("longestRun", () => {
  test("measures the longest consecutive run of a character", () => {
    expect(longestRun("a``b```c", "`")).toBe(3);
  });

  test("returns zero when the character is absent", () => {
    expect(longestRun("abc", "`")).toBe(0);
  });
});
