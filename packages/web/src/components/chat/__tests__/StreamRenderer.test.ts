import { describe, expect, test } from "vitest";
import StreamRenderer from "../StreamRenderer";
import type { MessageEvent } from "../types";

function item(listType: "ordered" | "unordered", depth: number): MessageEvent {
  return { type: "listitem", listType, depth };
}

function render(events: MessageEvent[]): string {
  const renderer = new StreamRenderer();
  for (const event of events) {
    renderer.append(event);
  }
  return renderer.container.innerHTML;
}

describe("StreamRenderer", () => {
  describe("append", () => {
    test("renders into a container with display: contents", () => {
      const renderer = new StreamRenderer();

      expect(renderer.container.tagName).toBe("DIV");
      expect(renderer.container.style.display).toBe("contents");
      expect(renderer.container.innerHTML).toBe("");
    });

    test("creates a paragraph for text before any block", () => {
      expect(render(["Hello"])).toBe("<p>Hello</p>");
    });

    test("appends subsequent text to the current block", () => {
      expect(render(["Hello", ", ", "world"])).toBe("<p>Hello, world</p>");
    });

    test("starts a new paragraph on a paragraph event", () => {
      expect(render(["One", { type: "paragraph" }, "Two"])).toBe("<p>One</p><p>Two</p>");
    });

    test("ignores an unknown node type", () => {
      const event = { type: "unknown" } as unknown as MessageEvent;

      expect(render([event, "Text"])).toBe("<p>Text</p>");
    });
  });

  describe("formatting", () => {
    test("wraps bold text in <strong> until toggled off", () => {
      expect(render(["a", { bold: true }, "b", { bold: false }, "c"])).toBe(
        "<p>a<strong>b</strong>c</p>",
      );
    });

    test("wraps italic text in <em> until toggled off", () => {
      expect(render(["a", { italic: true }, "b", { italic: false }, "c"])).toBe(
        "<p>a<em>b</em>c</p>",
      );
    });

    test("nests <em> inside <strong> when both are active", () => {
      expect(render([{ bold: true, italic: true }, "x"])).toBe(
        "<p><strong><em>x</em></strong></p>",
      );
    });

    test("keeps a format that is not mentioned in the event", () => {
      expect(render([{ bold: true }, { italic: true }, "x", { italic: false }, "y"])).toBe(
        "<p><strong><em>x</em></strong><strong>y</strong></p>",
      );
    });

    test("carries formatting across blocks", () => {
      expect(render([{ bold: true }, "a", { type: "paragraph" }, "b"])).toBe(
        "<p><strong>a</strong></p><p><strong>b</strong></p>",
      );
    });
  });

  describe("headings", () => {
    test("renders a heading at the requested level", () => {
      expect(render([{ type: "heading", level: 2 }, "Title"])).toBe("<h2>Title</h2>");
    });

    test("clamps the heading level to h3", () => {
      expect(render([{ type: "heading", level: 5 }, "Title"])).toBe("<h3>Title</h3>");
    });
  });

  describe("dividers", () => {
    test("appends an <hr> and starts a fresh paragraph for following text", () => {
      expect(render(["a", { type: "divider" }, "b"])).toBe("<p>a</p><hr><p>b</p>");
    });
  });

  describe("code", () => {
    test("renders a code block with the language and flows text into <code>", () => {
      expect(
        render([{ type: "code", language: "ts", lineNumbers: false }, "const a", " = 1;"]),
      ).toBe('<pre><code data-language="ts">const a = 1;</code></pre>');
    });

    test("omits the language attribute when empty", () => {
      expect(render([{ type: "code", language: "", lineNumbers: false }, "x"])).toBe(
        "<pre><code>x</code></pre>",
      );
    });
  });

  describe("lists", () => {
    test("creates an unordered list for the first item", () => {
      expect(render([item("unordered", 0), "a"])).toBe("<ul><li>a</li></ul>");
    });

    test("creates an ordered list for the first item", () => {
      expect(render([item("ordered", 0), "a"])).toBe("<ol><li>a</li></ol>");
    });

    test("appends items at the same depth to the same list", () => {
      expect(render([item("unordered", 0), "a", item("unordered", 0), "b"])).toBe(
        "<ul><li>a</li><li>b</li></ul>",
      );
    });

    test("starts a sibling list when the list type changes at the same depth", () => {
      expect(render([item("unordered", 0), "a", item("ordered", 0), "b"])).toBe(
        "<ul><li>a</li></ul><ol><li>b</li></ol>",
      );
    });

    test("nests deeper items and walks back up for shallower ones", () => {
      expect(
        render([
          item("unordered", 0),
          "a",
          item("unordered", 1),
          "b",
          item("ordered", 2),
          "c",
          item("unordered", 0),
          "d",
        ]),
      ).toBe("<ul><li>a<ul><li>b<ol><li>c</li></ol></li></ul></li><li>d</li></ul>");
    });

    test("walks up one level at a time", () => {
      expect(
        render([
          item("unordered", 0),
          "a",
          item("unordered", 1),
          "b",
          item("unordered", 2),
          "c",
          item("unordered", 1),
          "d",
        ]),
      ).toBe("<ul><li>a<ul><li>b<ul><li>c</li></ul></li><li>d</li></ul></li></ul>");
    });

    test("stops walking up at the outermost list", () => {
      expect(
        render([item("unordered", 0), "a", item("unordered", 1), "b", item("unordered", -1), "c"]),
      ).toBe("<ul><li>a<ul><li>b</li></ul></li><li>c</li></ul>");
    });

    test("starts a new list after a non-list block", () => {
      expect(
        render([item("unordered", 0), "a", { type: "paragraph" }, "b", item("unordered", 0), "c"]),
      ).toBe("<ul><li>a</li></ul><p>b</p><ul><li>c</li></ul>");
    });
  });
});
