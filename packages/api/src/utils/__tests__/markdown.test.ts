import { describe, expect, test } from "vitest";
import { transformMarkdown } from "../markdown.ts";

async function getEvents(input: string[]) {
  const stream = ReadableStream.from(input).pipeThrough(transformMarkdown());
  const output = await Array.fromAsync(stream);
  return output;
}

describe("transformMarkdown", () => {
  test("generates a stream of events", async () => {
    const output = await getEvents(["hello ", "world"]);
    expect(output).toEqual(["hello ", "world"]);
  });

  describe("bold", () => {
    test("supports **bold** syntax", async () => {
      const output = await getEvents(["hello **world**"]);
      expect(output).toEqual([
        "hello ",
        { bold: true },
        "world",
        { bold: false },
      ]);
    });

    test("supports __bold__ syntax", async () => {
      const output = await getEvents(["hello __world__"]);
      expect(output).toEqual([
        "hello ",
        { bold: true },
        "world",
        { bold: false },
      ]);
    });

    test("handles delimeters at the end of a chunk", async () => {
      const output = await getEvents(["hello **", "world", "**"]);
      expect(output).toEqual([
        "hello ",
        { bold: true },
        "world",
        { bold: false },
      ]);
    });

    test("handles delimiters split over two chunks", async () => {
      const output = await getEvents(["hello *", "*world*", "*"]);
      expect(output).toEqual([
        "hello ",
        { bold: true },
        "world",
        { bold: false },
      ]);
    });

    test("treats a start delimiter followed by whitespace as text", async () => {
      const output = await getEvents(["hello ** world"]);
      expect(output).toEqual(["hello ** world"]);
    });

    test("handles whitespace before bold delimiter", async () => {
      const output = await getEvents(["  **bold**"]);
      expect(output).toEqual([{ bold: true }, "bold", { bold: false }]);
    });

    test("preserves whitespace before bold when split across chunks", async () => {
      const output = await getEvents(["hello", " **world**"]);
      expect(output).toEqual([
        "hello",
        " ",
        { bold: true },
        "world",
        { bold: false },
      ]);
    });
  });

  describe("italic", () => {
    test("supports *italic* syntax", async () => {
      const output = await getEvents(["hello *world*"]);
      expect(output).toEqual([
        "hello ",
        { italic: true },
        "world",
        { italic: false },
      ]);
    });

    test("supports _italic_ syntax", async () => {
      const output = await getEvents(["hello _world_"]);
      expect(output).toEqual([
        "hello ",
        { italic: true },
        "world",
        { italic: false },
      ]);
    });

    test("handles delimeters at the end of a chunk", async () => {
      const output = await getEvents(["hello *", "world", "*"]);
      expect(output).toEqual([
        "hello ",
        { italic: true },
        "world",
        { italic: false },
      ]);
    });

    test("treats a start delimiter followed by whitespace as text", async () => {
      const output = await getEvents(["hello * world"]);
      expect(output).toEqual(["hello * world"]);
    });

    test("preserves whitespace before italic when split across chunks", async () => {
      const output = await getEvents(["hello", " *world*"]);
      expect(output).toEqual([
        "hello",
        " ",
        { italic: true },
        "world",
        { italic: false },
      ]);
    });
  });

  describe("bold and italic", () => {
    test("handles combined bold and italic", async () => {
      const output = await getEvents(["*hello **world***"]);
      expect(output).toEqual([
        { italic: true },
        "hello ",
        { bold: true },
        "world",
        { bold: false },
        { italic: false },
      ]);
    });

    test("preserves whitespace between bold and italic when split across chunks", async () => {
      const output = await getEvents(["**bold**", " *italic*"]);
      expect(output).toEqual([
        { bold: true },
        "bold",
        { bold: false },
        " ",
        { italic: true },
        "italic",
        { italic: false },
      ]);
    });
  });

  describe("line breaks", () => {
    test("treats a single line break as a space", async () => {
      const output = await getEvents(["hello\nworld"]);
      expect(output).toEqual(["hello", " world"]);
    });

    test("treats a line break preceded by one space as a space", async () => {
      const output = await getEvents(["hello \nworld"]);
      expect(output).toEqual(["hello", " world"]);
    });

    test("treats a line break preceded by one tab as a space", async () => {
      const output = await getEvents(["hello\t\nworld"]);
      expect(output).toEqual(["hello", " world"]);
    });

    test("treats an empty line as a paragraph break", async () => {
      const output = await getEvents(["hello\n\nworld"]);
      expect(output).toEqual(["hello", { type: "paragraph" }, "world"]);
    });

    test("treats multiple empty lines as one paragraph break", async () => {
      const output = await getEvents(["hello\n\n\n\nworld"]);
      expect(output).toEqual(["hello", { type: "paragraph" }, "world"]);
    });

    test("does not treat an empty line before a heading as a paragraph break", async () => {
      const output = await getEvents(["hello\n\n# world"]);
      expect(output).toEqual(["hello", { type: "heading", level: 1 }, "world"]);
    });

    test("treats a line containing only whitespace as an empty line", async () => {
      const output = await getEvents(["hello\n  \nworld"]);
      expect(output).toEqual(["hello", { type: "paragraph" }, "world"]);
    });

    test.for([2, 3, 4])(
      "treats %i spaces at the end of a line as a hard line break",
      async (i) => {
        const output = await getEvents([`hello${" ".repeat(i)}\nworld`]);
        expect(output).toEqual(["hello", "\nworld"]);
      },
    );

    test.for([2, 3, 4])(
      "treats %i tabs at the end of a line as a hard line break",
      async (i) => {
        const output = await getEvents([`hello${"\t".repeat(i)}\nworld`]);
        expect(output).toEqual(["hello", "\nworld"]);
      },
    );
  });

  describe("heading", () => {
    test("returns heading level 1", async () => {
      const output = await getEvents(["# hello world"]);
      expect(output).toEqual([{ type: "heading", level: 1 }, "hello world"]);
    });

    test("returns heading level 2", async () => {
      const output = await getEvents(["## hello world"]);
      expect(output).toEqual([{ type: "heading", level: 2 }, "hello world"]);
    });

    test("returns heading level 3", async () => {
      const output = await getEvents(["### hello world"]);
      expect(output).toEqual([{ type: "heading", level: 3 }, "hello world"]);
    });

    test("treats other headings as level 3", async () => {
      const output = await getEvents(["#### hello world"]);
      expect(output).toEqual([{ type: "heading", level: 3 }, "hello world"]);
    });

    test("requires whitespace between the delimeter and heading text", async () => {
      const output = await getEvents(["#hello world"]);
      expect(output).toEqual(["#hello world"]);
    });

    test("returns a heading following a line break", async () => {
      const output = await getEvents(["\n", "### hello world"]);
      expect(output).toEqual([{ type: "heading", level: 3 }, "hello world"]);
    });

    test("returns a heading following a paragraph", async () => {
      const output = await getEvents(["foo\n\n", "### hello world"]);
      expect(output).toEqual([
        "foo",
        { type: "heading", level: 3 },
        "hello world",
      ]);
    });

    test("requires the heading to be at the start of the line", async () => {
      const output = await getEvents(["abc ### hello world"]);
      expect(output).toEqual(["abc ### hello world"]);
    });

    test("supports heading markers split over multiple chunks", async () => {
      const output = await getEvents(["##", "# hello world"]);
      expect(output).toEqual([{ type: "heading", level: 3 }, "hello world"]);
    });

    test("supports heading split over multiple chunks", async () => {
      const output = await getEvents(["###", " hello world"]);
      expect(output).toEqual([{ type: "heading", level: 3 }, "hello world"]);
    });
  });

  describe("unordered list item", () => {
    test("supports - item syntax", async () => {
      const output = await getEvents(["- hello world"]);
      expect(output).toEqual([
        { type: "listitem", listType: "unordered", depth: 0 },
        "hello world",
      ]);
    });

    test("supports * item syntax", async () => {
      const output = await getEvents(["* hello world"]);
      expect(output).toEqual([
        { type: "listitem", listType: "unordered", depth: 0 },
        "hello world",
      ]);
    });

    test("supports + item syntax", async () => {
      const output = await getEvents(["+ hello world"]);
      expect(output).toEqual([
        { type: "listitem", listType: "unordered", depth: 0 },
        "hello world",
      ]);
    });

    test("supports + item split over multiple chunks", async () => {
      const output = await getEvents(["+", " hello world"]);
      expect(output).toEqual([
        { type: "listitem", listType: "unordered", depth: 0 },
        "hello world",
      ]);
    });

    test("supports item split over multiple chunks", async () => {
      const output = await getEvents(["- ", "hello world"]);
      expect(output).toEqual([
        { type: "listitem", listType: "unordered", depth: 0 },
        "hello world",
      ]);
    });

    test("supports formatted list items", async () => {
      const output = await getEvents(["* **hello world**"]);
      expect(output).toEqual([
        { type: "listitem", listType: "unordered", depth: 0 },
        { bold: true },
        "hello world",
        { bold: false },
      ]);
    });

    test("returns a series of list items", async () => {
      const output = await getEvents([
        "- hello world\n",
        "- foo",
        "\n",
        "- bar\n",
      ]);
      expect(output).toEqual([
        { type: "listitem", listType: "unordered", depth: 0 },
        "hello world",
        { type: "listitem", listType: "unordered", depth: 0 },
        "foo",
        { type: "listitem", listType: "unordered", depth: 0 },
        "bar",
      ]);
    });

    test("supports list item depth based on indentation", async () => {
      const output = await getEvents([
        "* hello world\n  * nested item 1\n    * nested item 2",
      ]);
      expect(output).toEqual([
        { type: "listitem", listType: "unordered", depth: 0 },
        "hello world",
        { type: "listitem", listType: "unordered", depth: 1 },
        "nested item 1",
        { type: "listitem", listType: "unordered", depth: 2 },
        "nested item 2",
      ]);
    });

    test("supports indentation split over chunks", async () => {
      const output = await getEvents([
        "* hello world\n ",
        " * nested item 1\n   ",
        " * nested item 2",
      ]);
      expect(output).toEqual([
        { type: "listitem", listType: "unordered", depth: 0 },
        "hello world",
        { type: "listitem", listType: "unordered", depth: 1 },
        "nested item 1",
        { type: "listitem", listType: "unordered", depth: 2 },
        "nested item 2",
      ]);
    });
  });

  describe("ordered list item", () => {
    test("supports 1. item syntax", async () => {
      const output = await getEvents(["1. hello world"]);
      expect(output).toEqual([
        { type: "listitem", listType: "ordered", depth: 0 },
        "hello world",
      ]);
    });

    test("supports item split over multiple chunks", async () => {
      const output = await getEvents(["1", ". hello world"]);
      expect(output).toEqual([
        { type: "listitem", listType: "ordered", depth: 0 },
        "hello world",
      ]);
    });

    test("supports formatted list items", async () => {
      const output = await getEvents(["1. **hello world**"]);
      expect(output).toEqual([
        { type: "listitem", listType: "ordered", depth: 0 },
        { bold: true },
        "hello world",
        { bold: false },
      ]);
    });

    test("returns a series of list items", async () => {
      const output = await getEvents([
        "1. hello world\n",
        "2. foo",
        "\n",
        "3. bar\n",
      ]);
      expect(output).toEqual([
        { type: "listitem", listType: "ordered", depth: 0 },
        "hello world",
        { type: "listitem", listType: "ordered", depth: 0 },
        "foo",
        { type: "listitem", listType: "ordered", depth: 0 },
        "bar",
      ]);
    });

    test("supports nested list items", async () => {
      const output = await getEvents([
        "1. hello world\n  1. nested item 1\n  2. nested item 2",
      ]);
      expect(output).toEqual([
        { type: "listitem", listType: "ordered", depth: 0 },
        "hello world",
        { type: "listitem", listType: "ordered", depth: 1 },
        "nested item 1",
        { type: "listitem", listType: "ordered", depth: 1 },
        "nested item 2",
      ]);
    });
  });

  describe("divider", () => {
    test("supports --- syntax", async () => {
      const output = await getEvents(["---\n"]);
      expect(output).toEqual([{ type: "divider" }]);
    });

    test("supports *** syntax", async () => {
      const output = await getEvents(["***\n"]);
      expect(output).toEqual([{ type: "divider" }]);
    });

    test("supports ___ syntax", async () => {
      const output = await getEvents(["___\n"]);
      expect(output).toEqual([{ type: "divider" }]);
    });

    test("supports more than 3 characters", async () => {
      const output = await getEvents(["-----\n"]);
      expect(output).toEqual([{ type: "divider" }]);
    });

    test("allows trailing whitespace", async () => {
      const output = await getEvents(["---  \n"]);
      expect(output).toEqual([{ type: "divider" }]);
    });

    test("returns a divider between paragraphs", async () => {
      const output = await getEvents(["hello\n\n---\nworld"]);
      expect(output).toEqual([
        "hello",
        { type: "divider" },
        { type: "paragraph" },
        "world",
      ]);
    });

    test("supports divider split over multiple chunks", async () => {
      const output = await getEvents(["--", "-\n"]);
      expect(output).toEqual([{ type: "divider" }]);
    });
  });

  describe("blocks", () => {
    test("returns a block start", async () => {
      const output = await getEvents([">>> 1\n", "hello world"]);
      expect(output).toEqual([
        { destination: 1, mode: "insert" },
        "hello world",
      ]);
    });

    test("supports block start syntax split over multiple chunks", async () => {
      const output = await getEvents([">>", "> 1", "2", "\n", "hello world"]);
      expect(output).toEqual([
        { destination: 12, mode: "insert" },
        "hello world",
      ]);
    });

    test("returns a block end", async () => {
      const output = await getEvents(["<<<\n", "hello world"]);
      expect(output).toEqual([{ destination: null }, "hello world"]);
    });

    test("supports block end syntax split over multiple chunks", async () => {
      const output = await getEvents(["<<", "<", "\n", "hello world"]);
      expect(output).toEqual([{ destination: null }, "hello world"]);
    });

    test("handles block end at end of stream without trailing newline", async () => {
      const output = await getEvents([">>> 0\n", "hello\n", "<<<"]);
      expect(output).toEqual([
        { destination: 0, mode: "insert" },
        "hello",
        { destination: null, mode: undefined },
      ]);
    });

    test("supports replace mode with >>>= syntax", async () => {
      const output = await getEvents([">>>= 1\n", "replaced content"]);
      expect(output).toEqual([
        { destination: 1, mode: "replace" },
        "replaced content",
      ]);
    });

    test("supports append mode with >>>+ syntax", async () => {
      const output = await getEvents([">>>+ 1\n", "appended content"]);
      expect(output).toEqual([
        { destination: 1, mode: "append" },
        "appended content",
      ]);
    });

    test("supports prepend mode with >>>^ syntax", async () => {
      const output = await getEvents([">>>^ 1\n", "prepended content"]);
      expect(output).toEqual([
        { destination: 1, mode: "prepend" },
        "prepended content",
      ]);
    });

    test("supports selection mode with >>>@ syntax", async () => {
      const output = await getEvents([">>>@ 1\n", "inserted content"]);
      expect(output).toEqual([
        { destination: 1, mode: "selection" },
        "inserted content",
      ]);
    });

    test("ignores block start with non-numeric ID", async () => {
      const output = await getEvents([">>> abc\n", "hello world"]);
      expect(output).toEqual([">>> abc", " hello world"]);
    });
  });

  describe("code blocks", () => {
    test("supports backtick code blocks with language", async () => {
      const output = await getEvents(["```js\nconst x = 1;\n```\n"]);
      expect(output).toEqual([
        { type: "code", language: "js", lineNumbers: false },
        "const x = 1;",
      ]);
    });

    test("supports backtick code blocks without language", async () => {
      const output = await getEvents(["```\nhello\n```\n"]);
      expect(output).toEqual([
        { type: "code", language: "", lineNumbers: false },
        "hello",
      ]);
    });

    test("supports tilde code blocks", async () => {
      const output = await getEvents(["~~~python\nprint('hi')\n~~~\n"]);
      expect(output).toEqual([
        { type: "code", language: "python", lineNumbers: false },
        "print('hi')",
      ]);
    });

    test("requires closing fence to match opening fence character", async () => {
      const output = await getEvents(["```js\ncode\n~~~\nmore\n```\n"]);
      expect(output).toEqual([
        { type: "code", language: "js", lineNumbers: false },
        "code",
        "\n~~~",
        "\nmore",
      ]);
    });

    test("requires closing fence to be at least as long as opening", async () => {
      const output = await getEvents(["````\ncode\n```\nmore\n````\n"]);
      expect(output).toEqual([
        { type: "code", language: "", lineNumbers: false },
        "code",
        "\n```",
        "\nmore",
      ]);
    });

    test("does not process markdown inside code blocks", async () => {
      const output = await getEvents(["```\n**bold** # heading\n```\n"]);
      expect(output).toEqual([
        { type: "code", language: "", lineNumbers: false },
        "**bold** # heading",
      ]);
    });

    test("handles code block split across chunks", async () => {
      const output = await getEvents(["```", "js\n", "code\n", "```\n"]);
      expect(output).toEqual([
        { type: "code", language: "js", lineNumbers: false },
        "code",
      ]);
    });

    test("handles code block end at end of stream without trailing newline", async () => {
      const output = await getEvents(["```\nhello\n```"]);
      expect(output).toEqual([
        { type: "code", language: "", lineNumbers: false },
        "hello",
      ]);
    });

    test("preserves empty lines in code blocks", async () => {
      const output = await getEvents(["```\nline1\n\nline2\n```\n"]);
      expect(output).toEqual([
        { type: "code", language: "", lineNumbers: false },
        "line1",
        "\n",
        "\nline2",
      ]);
    });

    test("emits remaining content in unclosed code block at end of stream", async () => {
      const output = await getEvents(["```\nline1\nline2"]);
      expect(output).toEqual([
        { type: "code", language: "", lineNumbers: false },
        "line1",
        "\nline2",
      ]);
    });
  });
});
