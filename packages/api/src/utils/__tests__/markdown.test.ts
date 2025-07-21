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
    expect(output).toEqual(["hello ", "world"]);
  });

  describe("bold", () => {
    test("supports **bold** syntax", async () => {
      const stream = toAsync(["hello **world**"]);
      const output = await Array.fromAsync(parseMarkdown(stream));
      expect(output).toEqual([
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
        "hello ",
        { bold: true },
        "world",
        { bold: false },
      ]);
    });

    test("treats a start delimiter followed by whitespace as text", async () => {
      const stream = toAsync(["hello ** world"]);
      const output = await Array.fromAsync(parseMarkdown(stream));
      expect(output).toEqual(["hello ", "** world"]);
    });
  });

  describe("italic", () => {
    test("supports *italic* syntax", async () => {
      const stream = toAsync(["hello *world*"]);
      const output = await Array.fromAsync(parseMarkdown(stream));
      expect(output).toEqual([
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
        "hello ",
        { italic: true },
        "world",
        { italic: false },
      ]);
    });

    test("treats a start delimiter followed by whitespace as text", async () => {
      const stream = toAsync(["hello * world"]);
      const output = await Array.fromAsync(parseMarkdown(stream));
      expect(output).toEqual(["hello ", "* world"]);
    });
  });

  describe("bold and italic", () => {
    test("handles combined bold and italic", async () => {
      const stream = toAsync(["*hello **world***"]);
      const output = await Array.fromAsync(parseMarkdown(stream));
      expect(output).toEqual([
        { italic: true },
        "hello ",
        { bold: true },
        "world",
        { bold: false },
        { italic: false },
      ]);
    });
  });

  describe("paragraph", () => {
    test("treats two sequential line breaks as a paragraph break", async () => {
      const stream = toAsync(["hello\n\nworld"]);
      const output = await Array.fromAsync(parseMarkdown(stream));
      expect(output).toEqual(["hello", { block: "P" }, "world"]);
    });

    test("treats more than two sequential line breaks as a paragraph break", async () => {
      const stream = toAsync(["hello\n\n\n\nworld"]);
      const output = await Array.fromAsync(parseMarkdown(stream));
      expect(output).toEqual(["hello", { block: "P" }, "world"]);
    });

    test("does not treat two sequential line breaks before a heading as a paragraph break", async () => {
      const stream = toAsync(["hello\n\n# world"]);
      const output = await Array.fromAsync(parseMarkdown(stream));
      expect(output).toEqual(["hello", { block: "H1" }, "world"]);
    });
  });

  describe("heading", () => {
    test("returns heading level 1", async () => {
      const stream = toAsync(["# hello world"]);
      const output = await Array.fromAsync(parseMarkdown(stream));
      expect(output).toEqual([{ block: "H1" }, "hello world"]);
    });

    test("returns heading level 2", async () => {
      const stream = toAsync(["## hello world"]);
      const output = await Array.fromAsync(parseMarkdown(stream));
      expect(output).toEqual([{ block: "H2" }, "hello world"]);
    });

    test("returns heading level 3", async () => {
      const stream = toAsync(["### hello world"]);
      const output = await Array.fromAsync(parseMarkdown(stream));
      expect(output).toEqual([{ block: "H3" }, "hello world"]);
    });

    test("requires whitespace between the delimeter and heading text", async () => {
      const stream = toAsync(["#hello world"]);
      const output = await Array.fromAsync(parseMarkdown(stream));
      expect(output).toEqual(["#hello world"]);
    });

    test("returns a heading following a line break", async () => {
      const stream = toAsync(["\n", "### hello world"]);
      const output = await Array.fromAsync(parseMarkdown(stream));
      expect(output).toEqual([{ block: "H3" }, "hello world"]);
    });

    test("returns a heading following a paragraph", async () => {
      const stream = toAsync(["foo\n\n", "### hello world"]);
      const output = await Array.fromAsync(parseMarkdown(stream));
      expect(output).toEqual(["foo", { block: "H3" }, "hello world"]);
    });

    test("requires the heading to be at the start of the line", async () => {
      const stream = toAsync(["abc ### hello world"]);
      const output = await Array.fromAsync(parseMarkdown(stream));
      expect(output).toEqual(["abc ### hello world"]);
    });

    test("supports heading markers split over multiple chunks", async () => {
      const stream = toAsync(["##", "# hello world"]);
      const output = await Array.fromAsync(parseMarkdown(stream));
      expect(output).toEqual([{ block: "H3" }, "hello world"]);
    });

    test("supports heading split over multiple chunks", async () => {
      const stream = toAsync(["###", " hello world"]);
      const output = await Array.fromAsync(parseMarkdown(stream));
      expect(output).toEqual([{ block: "H3" }, "hello world"]);
    });
  });

  describe("unordered list item", () => {
    test("supports - item syntax", async () => {
      const stream = toAsync(["- hello world"]);
      const output = await Array.fromAsync(parseMarkdown(stream));
      expect(output).toEqual([{ block: "UL" }, "hello world"]);
    });

    test("supports * item syntax", async () => {
      const stream = toAsync(["* hello world"]);
      const output = await Array.fromAsync(parseMarkdown(stream));
      expect(output).toEqual([{ block: "UL" }, "hello world"]);
    });

    test("supports + item syntax", async () => {
      const stream = toAsync(["+ hello world"]);
      const output = await Array.fromAsync(parseMarkdown(stream));
      expect(output).toEqual([{ block: "UL" }, "hello world"]);
    });

    test("supports item split over multiple chunks", async () => {
      const stream = toAsync(["- ", "hello world"]);
      const output = await Array.fromAsync(parseMarkdown(stream));
      expect(output).toEqual([{ block: "UL" }, "hello world"]);
    });

    test("supports formatted list items", async () => {
      const stream = toAsync(["* **hello world**"]);
      const output = await Array.fromAsync(parseMarkdown(stream));
      expect(output).toEqual([
        { block: "UL" },
        { bold: true },
        "hello world",
        { bold: false },
      ]);
    });

    test("returns a series of list items", async () => {
      const stream = toAsync(["- hello world\n", "- foo", "\n", "- bar\n"]);
      const output = await Array.fromAsync(parseMarkdown(stream));
      expect(output).toEqual([
        { block: "UL" },
        "hello world",
        { block: "UL" },
        "foo",
        { block: "UL" },
        "bar",
      ]);
    });
  });

  describe("ordered list item", () => {
    test("supports 1. item syntax", async () => {
      const stream = toAsync(["1. hello world"]);
      const output = await Array.fromAsync(parseMarkdown(stream));
      expect(output).toEqual([{ block: "OL" }, "hello world"]);
    });

    test("supports item split over multiple chunks", async () => {
      const stream = toAsync(["1", ". hello world"]);
      const output = await Array.fromAsync(parseMarkdown(stream));
      expect(output).toEqual([{ block: "OL" }, "hello world"]);
    });

    test("supports formatted list items", async () => {
      const stream = toAsync(["1. **hello world**"]);
      const output = await Array.fromAsync(parseMarkdown(stream));
      expect(output).toEqual([
        { block: "OL" },
        { bold: true },
        "hello world",
        { bold: false },
      ]);
    });

    test("returns a series of list items", async () => {
      const stream = toAsync(["1. hello world\n", "2. foo", "\n", "3. bar\n"]);
      const output = await Array.fromAsync(parseMarkdown(stream));
      expect(output).toEqual([
        { block: "OL" },
        "hello world",
        { block: "OL" },
        "foo",
        { block: "OL" },
        "bar",
      ]);
    });
  });
});
