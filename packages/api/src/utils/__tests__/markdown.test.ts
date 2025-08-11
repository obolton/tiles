import { describe, expect, test } from "vitest";
import { parseMarkdown } from "../markdown.ts";

async function* toAsync<T>(chunks: T[]): AsyncGenerator<T> {
  for (const chunk of chunks) {
    yield Promise.resolve(chunk);
  }
}

describe("parseMarkdown", () => {
  test("generates a stream of events", async () => {
    const stream = toAsync(["hello ", "world"]);
    const output = await Array.fromAsync(parseMarkdown(stream));
    expect(output).toEqual([{ type: "paragraph" }, "hello ", "world"]);
  });

  describe("bold", () => {
    test("supports **bold** syntax", async () => {
      const stream = toAsync(["hello **world**"]);
      const output = await Array.fromAsync(parseMarkdown(stream));
      expect(output).toEqual([
        { type: "paragraph" },
        "hello ",
        { bold: true },
        "world",
        { bold: false },
      ]);
    });

    test("supports __bold__ syntax", async () => {
      const stream = toAsync(["hello __world__"]);
      const output = await Array.fromAsync(parseMarkdown(stream));
      expect(output).toEqual([
        { type: "paragraph" },
        "hello ",
        { bold: true },
        "world",
        { bold: false },
      ]);
    });

    test("handles delimeters at the end of a chunk", async () => {
      const stream = toAsync(["hello **", "world", "**"]);
      const output = await Array.fromAsync(parseMarkdown(stream));
      expect(output).toEqual([
        { type: "paragraph" },
        "hello ",
        { bold: true },
        "world",
        { bold: false },
      ]);
    });

    test("handles delimiters split over two chunks", async () => {
      const stream = toAsync(["hello *", "*world*", "*"]);
      const output = await Array.fromAsync(parseMarkdown(stream));
      expect(output).toEqual([
        { type: "paragraph" },
        "hello ",
        { bold: true },
        "world",
        { bold: false },
      ]);
    });

    test("treats a start delimiter followed by whitespace as text", async () => {
      const stream = toAsync(["hello ** world"]);
      const output = await Array.fromAsync(parseMarkdown(stream));
      expect(output).toEqual([{ type: "paragraph" }, "hello ** world"]);
    });
  });

  describe("italic", () => {
    test("supports *italic* syntax", async () => {
      const stream = toAsync(["hello *world*"]);
      const output = await Array.fromAsync(parseMarkdown(stream));
      expect(output).toEqual([
        { type: "paragraph" },
        "hello ",
        { italic: true },
        "world",
        { italic: false },
      ]);
    });

    test("supports _italic_ syntax", async () => {
      const stream = toAsync(["hello _world_"]);
      const output = await Array.fromAsync(parseMarkdown(stream));
      expect(output).toEqual([
        { type: "paragraph" },
        "hello ",
        { italic: true },
        "world",
        { italic: false },
      ]);
    });

    test("handles delimeters at the end of a chunk", async () => {
      const stream = toAsync(["hello *", "world", "*"]);
      const output = await Array.fromAsync(parseMarkdown(stream));
      expect(output).toEqual([
        { type: "paragraph" },
        "hello ",
        { italic: true },
        "world",
        { italic: false },
      ]);
    });

    test("treats a start delimiter followed by whitespace as text", async () => {
      const stream = toAsync(["hello * world"]);
      const output = await Array.fromAsync(parseMarkdown(stream));
      expect(output).toEqual([{ type: "paragraph" }, "hello * world"]);
    });
  });

  describe("bold and italic", () => {
    test("handles combined bold and italic", async () => {
      const stream = toAsync(["*hello **world***"]);
      const output = await Array.fromAsync(parseMarkdown(stream));
      expect(output).toEqual([
        { type: "paragraph" },
        { italic: true },
        "hello ",
        { bold: true },
        "world",
        { bold: false },
        { italic: false },
      ]);
    });
  });

  describe("line breaks", () => {
    test("treats a single line break as a space", async () => {
      const stream = toAsync(["hello\nworld"]);
      const output = await Array.fromAsync(parseMarkdown(stream));
      expect(output).toEqual([{ type: "paragraph" }, "hello", " world"]);
    });

    test("treats a line break preceded by one space as a space", async () => {
      const stream = toAsync(["hello \nworld"]);
      const output = await Array.fromAsync(parseMarkdown(stream));
      expect(output).toEqual([{ type: "paragraph" }, "hello", " world"]);
    });

    test("treats a line break preceded by one tab as a space", async () => {
      const stream = toAsync(["hello\t\nworld"]);
      const output = await Array.fromAsync(parseMarkdown(stream));
      expect(output).toEqual([{ type: "paragraph" }, "hello", " world"]);
    });

    test("treats an empty line as a paragraph break", async () => {
      const stream = toAsync(["hello\n\nworld"]);
      const output = await Array.fromAsync(parseMarkdown(stream));
      expect(output).toEqual([
        { type: "paragraph" },
        "hello",
        { type: "paragraph" },
        "world",
      ]);
    });

    test("treats multiple empty lines as one paragraph break", async () => {
      const stream = toAsync(["hello\n\n\n\nworld"]);
      const output = await Array.fromAsync(parseMarkdown(stream));
      expect(output).toEqual([
        { type: "paragraph" },
        "hello",
        { type: "paragraph" },
        "world",
      ]);
    });

    test("does not treat an empty line before a heading as a paragraph break", async () => {
      const stream = toAsync(["hello\n\n# world"]);
      const output = await Array.fromAsync(parseMarkdown(stream));
      expect(output).toEqual([
        { type: "paragraph" },
        "hello",
        { type: "heading", level: 1 },
        "world",
      ]);
    });

    test("treats a line containing only whitespace as an empty line", async () => {
      const stream = toAsync(["hello\n  \nworld"]);
      const output = await Array.fromAsync(parseMarkdown(stream));
      expect(output).toEqual([
        { type: "paragraph" },
        "hello",
        { type: "paragraph" },
        "world",
      ]);
    });

    test.for([2, 3, 4])(
      "treats %i spaces at the end of a line as a hard line break",
      async (i) => {
        const stream = toAsync([`hello${" ".repeat(i)}\nworld`]);
        const output = await Array.fromAsync(parseMarkdown(stream));
        expect(output).toEqual([{ type: "paragraph" }, "hello", "\nworld"]);
      },
    );

    test.for([2, 3, 4])(
      "treats %i tabs at the end of a line as a hard line break",
      async (i) => {
        const stream = toAsync([`hello${"\t".repeat(i)}\nworld`]);
        const output = await Array.fromAsync(parseMarkdown(stream));
        expect(output).toEqual([{ type: "paragraph" }, "hello", "\nworld"]);
      },
    );
  });

  describe("heading", () => {
    test("returns heading level 1", async () => {
      const stream = toAsync(["# hello world"]);
      const output = await Array.fromAsync(parseMarkdown(stream));
      expect(output).toEqual([{ type: "heading", level: 1 }, "hello world"]);
    });

    test("returns heading level 2", async () => {
      const stream = toAsync(["## hello world"]);
      const output = await Array.fromAsync(parseMarkdown(stream));
      expect(output).toEqual([{ type: "heading", level: 2 }, "hello world"]);
    });

    test("returns heading level 3", async () => {
      const stream = toAsync(["### hello world"]);
      const output = await Array.fromAsync(parseMarkdown(stream));
      expect(output).toEqual([{ type: "heading", level: 3 }, "hello world"]);
    });

    test("treats other headings as level 3", async () => {
      const stream = toAsync(["#### hello world"]);
      const output = await Array.fromAsync(parseMarkdown(stream));
      expect(output).toEqual([{ type: "heading", level: 3 }, "hello world"]);
    });

    test("requires whitespace between the delimeter and heading text", async () => {
      const stream = toAsync(["#hello world"]);
      const output = await Array.fromAsync(parseMarkdown(stream));
      expect(output).toEqual([{ type: "paragraph" }, "#hello world"]);
    });

    test("returns a heading following a line break", async () => {
      const stream = toAsync(["\n", "### hello world"]);
      const output = await Array.fromAsync(parseMarkdown(stream));
      expect(output).toEqual([{ type: "heading", level: 3 }, "hello world"]);
    });

    test("returns a heading following a paragraph", async () => {
      const stream = toAsync(["foo\n\n", "### hello world"]);
      const output = await Array.fromAsync(parseMarkdown(stream));
      expect(output).toEqual([
        { type: "paragraph" },
        "foo",
        { type: "heading", level: 3 },
        "hello world",
      ]);
    });

    test("requires the heading to be at the start of the line", async () => {
      const stream = toAsync(["abc ### hello world"]);
      const output = await Array.fromAsync(parseMarkdown(stream));
      expect(output).toEqual([{ type: "paragraph" }, "abc ### hello world"]);
    });

    test("supports heading markers split over multiple chunks", async () => {
      const stream = toAsync(["##", "# hello world"]);
      const output = await Array.fromAsync(parseMarkdown(stream));
      expect(output).toEqual([{ type: "heading", level: 3 }, "hello world"]);
    });

    test("supports heading split over multiple chunks", async () => {
      const stream = toAsync(["###", " hello world"]);
      const output = await Array.fromAsync(parseMarkdown(stream));
      expect(output).toEqual([{ type: "heading", level: 3 }, "hello world"]);
    });
  });

  describe("unordered list item", () => {
    test("supports - item syntax", async () => {
      const stream = toAsync(["- hello world"]);
      const output = await Array.fromAsync(parseMarkdown(stream));
      expect(output).toEqual([
        { type: "listitem", listType: "unordered", depth: 0 },
        "hello world",
      ]);
    });

    test("supports * item syntax", async () => {
      const stream = toAsync(["* hello world"]);
      const output = await Array.fromAsync(parseMarkdown(stream));
      expect(output).toEqual([
        { type: "listitem", listType: "unordered", depth: 0 },
        "hello world",
      ]);
    });

    test("supports + item syntax", async () => {
      const stream = toAsync(["+ hello world"]);
      const output = await Array.fromAsync(parseMarkdown(stream));
      expect(output).toEqual([
        { type: "listitem", listType: "unordered", depth: 0 },
        "hello world",
      ]);
    });

    test("supports item split over multiple chunks", async () => {
      const stream = toAsync(["- ", "hello world"]);
      const output = await Array.fromAsync(parseMarkdown(stream));
      expect(output).toEqual([
        { type: "listitem", listType: "unordered", depth: 0 },
        "hello world",
      ]);
    });

    test("supports formatted list items", async () => {
      const stream = toAsync(["* **hello world**"]);
      const output = await Array.fromAsync(parseMarkdown(stream));
      expect(output).toEqual([
        { type: "listitem", listType: "unordered", depth: 0 },
        { bold: true },
        "hello world",
        { bold: false },
      ]);
    });

    test("returns a series of list items", async () => {
      const stream = toAsync(["- hello world\n", "- foo", "\n", "- bar\n"]);
      const output = await Array.fromAsync(parseMarkdown(stream));
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
      const stream = toAsync([
        "* hello world\n  * nested item 1\n    * nested item 2",
      ]);
      const output = await Array.fromAsync(parseMarkdown(stream));
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
      const stream = toAsync([
        "* hello world\n ",
        " * nested item 1\n   ",
        " * nested item 2",
      ]);
      const output = await Array.fromAsync(parseMarkdown(stream));
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
      const stream = toAsync(["1. hello world"]);
      const output = await Array.fromAsync(parseMarkdown(stream));
      expect(output).toEqual([
        { type: "listitem", listType: "ordered", depth: 0 },
        "hello world",
      ]);
    });

    test("supports item split over multiple chunks", async () => {
      const stream = toAsync(["1", ". hello world"]);
      const output = await Array.fromAsync(parseMarkdown(stream));
      expect(output).toEqual([
        { type: "listitem", listType: "ordered", depth: 0 },
        "hello world",
      ]);
    });

    test("supports formatted list items", async () => {
      const stream = toAsync(["1. **hello world**"]);
      const output = await Array.fromAsync(parseMarkdown(stream));
      expect(output).toEqual([
        { type: "listitem", listType: "ordered", depth: 0 },
        { bold: true },
        "hello world",
        { bold: false },
      ]);
    });

    test("returns a series of list items", async () => {
      const stream = toAsync(["1. hello world\n", "2. foo", "\n", "3. bar\n"]);
      const output = await Array.fromAsync(parseMarkdown(stream));
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
      const stream = toAsync([
        "1. hello world\n  1. nested item 1\n  2. nested item 2",
      ]);
      const output = await Array.fromAsync(parseMarkdown(stream));
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
});
