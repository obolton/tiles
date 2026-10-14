import { describe, expect, test } from "vitest";
import { DOMParser, DOMSerializer, type Node } from "prosemirror-model";
import { MAX_INDENT, MIN_TEXT_SIZE, MAX_TEXT_SIZE } from "@/constants/formatting";
import { schema } from "../schema";
import {
  bold,
  checkList,
  codeBlock,
  date,
  divider,
  doc,
  dropdown,
  h,
  li,
  mention,
  link,
  ol,
  p,
  pendingBlock,
  quote,
  text,
  ul,
} from "./builders";

const parser = DOMParser.fromSchema(schema);

function parse(html: string) {
  const container = document.createElement("div");
  container.innerHTML = html;
  return parser.parse(container);
}

function mark(name: string, attrs?: Record<string, unknown>) {
  const type = schema.marks[name];
  if (!type) {
    throw new Error(`Unknown mark: ${name}`);
  }
  return type.create(attrs);
}

// Nodes rendered by node views have no toDOM, so give them one for round trips.
const serializer = new DOMSerializer(
  {
    ...DOMSerializer.nodesFromSchema(schema),
    list_item: (node) => [
      "li",
      node.attrs.checked ? { role: "checkbox", "aria-checked": "true" } : {},
      0,
    ],
    date: (node) => ["time", { datetime: node.attrs.value as string }, "date"],
  },
  DOMSerializer.marksFromSchema(schema),
);

function serialize(node: Node): HTMLElement {
  const dom = serializer.serializeNode(node);
  if (!(dom instanceof HTMLElement)) {
    throw new TypeError("Expected an element");
  }
  return dom;
}

function serializeDoc(node: Node) {
  const container = document.createElement("div");
  container.append(serializer.serializeFragment(node.content));
  return container;
}

describe("schema", () => {
  describe("size mark", () => {
    test.each([MIN_TEXT_SIZE, 1, 1.25, MAX_TEXT_SIZE])("accepts size %s", (size) => {
      expect(schema.marks.size.create({ size }).attrs.size).toBe(size);
    });

    test.each([MIN_TEXT_SIZE - 0.1, MAX_TEXT_SIZE + 0.1, Number.NaN, "1", null])(
      "rejects size %s",
      (size) => {
        expect(() => schema.marks.size.create({ size })).toThrow(RangeError);
      },
    );
  });

  describe("attribute validation", () => {
    test.each(["left", "center", "right", "justify"])("accepts alignment %s", (align) => {
      expect(p([], { align }).attrs.align).toBe(align);
    });

    test.each(["top", "", null])("rejects alignment %s", (align) => {
      expect(() => p([], { align })).toThrow(RangeError);
    });

    test.each([1, 1.5, 3, undefined])("accepts line height %s", (lineHeight) => {
      expect(p([], { lineHeight }).attrs.lineHeight).toBe(lineHeight);
    });

    test.each([0.5, 3.5, "1.5", null])("rejects line height %s", (lineHeight) => {
      expect(() => p([], { lineHeight })).toThrow(RangeError);
    });

    test.each([1, MAX_INDENT, undefined])("accepts indent %s", (indent) => {
      expect(h(1, [], { indent }).attrs.indent).toBe(indent);
    });

    test.each([0, MAX_INDENT + 1, "2", null])("rejects indent %s", (indent) => {
      expect(() => h(1, [], { indent })).toThrow(RangeError);
    });

    test("rejects heading levels outside 1 to 3", () => {
      expect(() => schema.node("heading", { level: 4 })).toThrow(RangeError);
      expect(() => schema.node("heading", { level: "1" })).toThrow(RangeError);
    });

    test("rejects colors that are not 12-digit hex", () => {
      expect(mark("color", { color: "ff0000ff0000" }).attrs.color).toBe("ff0000ff0000");
      expect(() => mark("color", { color: "#ff0000" })).toThrow(RangeError);
      expect(() => mark("color", { color: 1 })).toThrow(RangeError);
    });

    test("rejects unknown fonts", () => {
      expect(mark("font", { font: "lora" }).attrs.font).toBe("lora");
      expect(() => mark("font", { font: "comic-sans" })).toThrow(RangeError);
      expect(() => mark("font", { font: 1 })).toThrow(RangeError);
    });

    test("superscript and subscript exclude each other", () => {
      const superscript = mark("superscript");
      const subscript = mark("subscript");
      expect(subscript.addToSet([superscript])).toEqual([subscript]);
      expect(superscript.addToSet([subscript])).toEqual([superscript]);
    });
  });

  describe("leaf text", () => {
    test("dropdowns and mentions read as their visible value", () => {
      const content = p([dropdown("status", "Done"), " ", mention("user-1", "Ada")]);
      expect(content.textContent).toBe("Done Ada");
    });
  });

  describe("parseDOM", () => {
    test("parses text block style into attributes", () => {
      const parsed = parse(
        '<p style="text-align: center; line-height: 1.5; padding-left: 64px">x</p>',
      );
      expect(parsed.eq(doc(p("x", { align: "center", lineHeight: 1.5, indent: 2 })))).toBe(true);
    });

    test("treats padding without a px unit as rem", () => {
      expect(parse('<p style="padding-left: 4rem">x</p>').eq(doc(p("x", { indent: 2 })))).toBe(
        true,
      );
    });

    test.each([
      ["0", undefined],
      ["0.5rem", undefined],
      ["1rem", 1],
      ["16px", 1],
      ["48px", 2],
      ["40rem", MAX_INDENT],
    ])("maps padding-left %s to indent %s", (paddingLeft, indent) => {
      const parsed = parse(`<p style="padding-left: ${paddingLeft}">x</p>`);
      expect(parsed.firstChild?.attrs.indent).toBe(indent);
    });

    test.each([
      ["0.5", 1],
      ["2", 2],
      ["10", 3],
      ["normal", undefined],
    ])("clamps line-height %s to %s", (lineHeight, expected) => {
      const parsed = parse(`<p style="line-height: ${lineHeight}">x</p>`);
      expect(parsed.firstChild?.attrs.lineHeight).toBe(expected);
    });

    test("falls back to left alignment for unknown values", () => {
      expect(parse('<p style="text-align: start">x</p>').firstChild?.attrs.align).toBe("left");
      expect(parse('<p style="text-align: justify">x</p>').firstChild?.attrs.align).toBe("justify");
    });

    test.each([1, 2, 3] as const)("parses h%s with its text attributes", (level) => {
      const parsed = parse(`<h${level} style="text-align: right">Title</h${level}>`);
      expect(parsed.eq(doc(h(level, "Title", { align: "right" })))).toBe(true);
    });

    test("parses lists", () => {
      expect(parse("<ol><li><p>One</p></li></ol>").eq(doc(ol(li(p("One")))))).toBe(true);
      expect(parse('<ol start="3"><li>One</li></ol>').firstChild?.attrs.order).toBe(3);
      expect(parse("<ul><li>One</li></ul>").eq(doc(ul(li(p("One")))))).toBe(true);
      expect(
        parse('<ul class="checklist"><li>One</li></ul>').eq(doc(checkList(li(p("One"))))),
      ).toBe(true);
    });

    test("parses checked state from checkbox list items", () => {
      const parsed = parse(
        '<ul class="checklist"><li role="checkbox" aria-checked="true">Done</li><li role="checkbox" aria-checked="false">Todo</li><li>Plain</li></ul>',
      );
      expect(
        parsed.eq(
          doc(
            checkList(
              li(p("Done"), { checked: true }),
              li(p("Todo"), { checked: false }),
              li(p("Plain")),
            ),
          ),
        ),
      ).toBe(true);
    });

    test("parses links with an href and ignores anchors without one", () => {
      expect(
        parse('<p>See <a href="https://example.com">docs</a></p>').eq(
          doc(p(["See ", link("https://example.com", "docs")])),
        ),
      ).toBe(true);
      expect(parse("<p><a>plain</a></p>").eq(doc(p("plain")))).toBe(true);
    });

    test("parses time elements into dates", () => {
      expect(
        parse('<p><time datetime="2026-10-13">d</time></p>').eq(doc(p(date("2026-10-13")))),
      ).toBe(true);
      expect(
        parse('<p><time datetime="2026-10-13T09:30:00.000Z">d</time></p>').eq(
          doc(p(date("2026-10-13T09:30:00.000Z", true))),
        ),
      ).toBe(true);
      expect(parse("<p><time>d</time></p>").eq(doc(p(date(""))))).toBe(true);
    });

    test("parses code blocks preserving whitespace and dropping marks", () => {
      expect(parse("<pre>  a\n\n  b\n</pre>").eq(doc(codeBlock("  a\n\n  b\n")))).toBe(true);
      expect(parse("<pre><code><b>x</b></code></pre>").eq(doc(codeBlock("x")))).toBe(true);
    });

    test("parses quotes and dividers", () => {
      expect(parse("<blockquote><p>x</p></blockquote><hr>").eq(doc(quote(p("x")), divider()))).toBe(
        true,
      );
    });

    test.each([
      ["<strong>x</strong>", "bold"],
      ["<b>x</b>", "bold"],
      ["<em>x</em>", "italic"],
      ["<i>x</i>", "italic"],
      ['<span style="font-style: italic">x</span>', "italic"],
      ["<u>x</u>", "underline"],
      ['<span class="underline">x</span>', "underline"],
      ['<span style="text-decoration: underline">x</span>', "underline"],
      ["<del>x</del>", "strikethrough"],
      ['<span style="text-decoration: line-through">x</span>', "strikethrough"],
      ["<mark>x</mark>", "highlight"],
      ["<sup>x</sup>", "superscript"],
      ["<sub>x</sub>", "subscript"],
      ['<span class="small-caps">x</span>', "smallCaps"],
      ['<span style="font-variant: small-caps">x</span>', "smallCaps"],
      ["<code>x</code>", "code"],
    ] as const)("parses %s as the %s mark", (html, name) => {
      expect(parse(`<p>${html}</p>`).eq(doc(p(text("x", mark(name)))))).toBe(true);
    });

    test.each([
      ["24px", 2],
      ["20px", 1],
      ["2em", 2],
      ["18pt", 1],
      ["100px", MAX_TEXT_SIZE],
      ["1px", MIN_TEXT_SIZE],
    ])("parses font-size %s as size %s", (fontSize, size) => {
      const parsed = parse(`<p><span style="font-size: ${fontSize}">x</span></p>`);
      expect(parsed.eq(doc(p(text("x", mark("size", { size })))))).toBe(true);
    });

    test.each(["huge", "inherit"])("ignores the unparseable font size %s", (fontSize) => {
      const parsed = parse(`<p><span style="font-size: ${fontSize}">x</span></p>`);
      expect(parsed.eq(doc(p("x")))).toBe(true);
    });

    test("keeps only the innermost of superscript and subscript", () => {
      expect(parse("<p><sup><sub>x</sub></sup></p>").eq(doc(p(text("x", mark("subscript")))))).toBe(
        true,
      );
    });
  });

  describe("toDOM", () => {
    test("renders paragraphs with alignment, line height and indent", () => {
      const plain = serialize(p("x"));
      expect(plain.tagName).toBe("P");
      expect(plain.className).toBe("left");
      expect(plain.getAttribute("style")).toBeNull();

      const styled = serialize(p("x", { align: "center", lineHeight: 1.5, indent: 2 }));
      expect(styled.className).toBe("center");
      expect(styled.style.lineHeight).toBe("1.5");
      expect(styled.style.getPropertyValue("--indent")).toBe("2");
    });

    test("renders headings by level with the same styles", () => {
      const heading = serialize(h(3, "x", { align: "right", indent: 1 }));
      expect(heading.tagName).toBe("H3");
      expect(heading.className).toBe("right");
      expect(heading.style.getPropertyValue("--indent")).toBe("1");
      expect(heading.style.lineHeight).toBe("");
    });

    test("renders ordered lists with a start only when it is not 1", () => {
      expect(serialize(ol(li(p("x")))).outerHTML).toBe('<ol><li><p class="left">x</p></li></ol>');
      expect(
        serialize(schema.node("ordered_list", { order: 3 }, [li(p("x"))])).getAttribute("start"),
      ).toBe("3");
    });

    test("renders unordered and check lists", () => {
      expect(serialize(ul(li(p("x")))).outerHTML).toBe('<ul><li><p class="left">x</p></li></ul>');
      expect(serialize(checkList(li(p("x")))).outerHTML).toBe(
        '<ul class="checklist"><li><p class="left">x</p></li></ul>',
      );
    });

    test("renders block containers", () => {
      expect(serialize(quote(p("x"))).outerHTML).toBe(
        '<blockquote><p class="left">x</p></blockquote>',
      );
      expect(serialize(pendingBlock(p("x"))).outerHTML).toBe('<ins><p class="left">x</p></ins>');
      expect(serialize(codeBlock("x")).outerHTML).toBe("<pre><code>x</code></pre>");
      expect(serialize(divider()).outerHTML).toBe("<hr>");
    });

    test("renders links", () => {
      expect(serialize(link("https://example.com", "x")).outerHTML).toBe(
        '<a href="https://example.com">x</a>',
      );
    });

    test.each([
      ["bold", "<strong>x</strong>"],
      ["italic", "<em>x</em>"],
      ["underline", '<span class="underline">x</span>'],
      ["strikethrough", "<del>x</del>"],
      ["highlight", "<mark>x</mark>"],
      ["superscript", "<sup>x</sup>"],
      ["subscript", "<sub>x</sub>"],
      ["smallCaps", '<span class="small-caps">x</span>'],
      ["code", "<code>x</code>"],
    ] as const)("renders the %s mark as %s", (name, html) => {
      expect(serializeDoc(doc(p(text("x", mark(name))))).innerHTML).toBe(
        `<p class="left">${html}</p>`,
      );
    });

    test("renders size, color and font marks as inline styles", () => {
      const size = serializeDoc(doc(p(text("x", mark("size", { size: 1.5 }))))).querySelector(
        "span",
      );
      expect(size?.style.fontSize).toBe("1.5em");

      const color = serializeDoc(
        doc(p(text("x", mark("color", { color: "ff0000ff0000" })))),
      ).querySelector("span");
      expect(color?.style.color).toBe("color(display-p3 0.9961 0.0039 0)");

      const font = serializeDoc(doc(p(text("x", mark("font", { font: "lora" }))))).querySelector(
        "span",
      );
      expect(font?.style.fontFamily).toBe('"Lora"');
    });
  });

  test("parsing the rendered DOM reproduces the document", () => {
    // Alignment is rendered as a class and indent as a custom property, so neither parses back.
    const content = doc(
      h(1, "Title", { lineHeight: 2 }),
      p(["plain ", text("bold", bold), text("sized", mark("size", { size: 2 }))], {
        lineHeight: 1.5,
      }),
      quote(p("quoted"), h(3, "attribution")),
      ol(li(p("one")), li(p("two"))),
      ul(li([p("item"), checkList(li(p("done"), { checked: true }), li(p("todo")))])),
      p(["See ", link("https://example.com", "docs"), " on ", date("2026-10-13")]),
      codeBlock("ls -la\n", { language: "sh", lineNumbers: true }),
      divider(),
      pendingBlock(p("draft")),
    );
    const container = serializeDoc(content);
    const parsed = parser.parse(container);
    // Code block attributes are not rendered and pending blocks have no parse rule.
    const expected = content.copy(
      content.content.replaceChild(6, codeBlock("ls -la\n")).replaceChild(8, p("draft")),
    );
    expect(parsed.toJSON()).toEqual(expected.toJSON());
  });
});
