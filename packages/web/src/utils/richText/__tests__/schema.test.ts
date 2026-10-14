import { describe, expect, test } from "vitest";
import { DOMParser, DOMSerializer, Fragment, type Node } from "prosemirror-model";
import {
  MIN_TEXT_SIZE,
  MAX_TEXT_SIZE,
  MIN_LINE_HEIGHT,
  MAX_LINE_HEIGHT,
  MAX_INDENT,
} from "@/constants/formatting";
import { toCSSColor } from "@/utils/color";
import { COLOR, FONT } from "@/test/fixtures/richText";
import {
  cl,
  codeBlock,
  divider,
  doc,
  dropdown,
  h1,
  h2,
  h3,
  li,
  link,
  mark,
  mention,
  ol,
  p,
  pendingBlock,
  quote,
  text,
  ul,
} from "@/test/helpers/richText";
import { schema, LIST_NODES } from "../schema";

const parser = DOMParser.fromSchema(schema);
const serializer = DOMSerializer.fromSchema(schema);

function parseHTML(html: string): Node {
  const container = document.createElement("div");
  container.innerHTML = html;
  return parser.parse(container);
}

function parseBlock(html: string): Node {
  const block = parseHTML(html).firstChild;
  if (!block) {
    throw new Error(`Nothing parsed from ${html}`);
  }
  return block;
}

function parseInline(html: string): Node {
  const inline = parseBlock(`<p>${html}</p>`).firstChild;
  if (!inline) {
    throw new Error(`Nothing parsed from ${html}`);
  }
  return inline;
}

function toHTML(content: Node | Fragment): string {
  const container = document.createElement("div");
  container.appendChild(serializer.serializeFragment(Fragment.from(content)));
  return container.innerHTML;
}

function render(node: Node): HTMLElement {
  const element = serializer.serializeNode(node);
  if (!(element instanceof HTMLElement)) {
    throw new Error(`${node.type.name} did not render an element`);
  }
  return element;
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
    test("paragraph alignment must be a known value", () => {
      expect(() => p({ align: "top" })).toThrow(RangeError);
      expect(p({ align: "justify" }).attrs.align).toBe("justify");
    });

    test.each([MIN_LINE_HEIGHT - 0.1, MAX_LINE_HEIGHT + 0.1, "2"])(
      "line height %s is rejected",
      (lineHeight) => {
        expect(() => p({ lineHeight })).toThrow(RangeError);
      },
    );

    test.each([0, MAX_INDENT + 1, "1"])("indent %s is rejected", (indent) => {
      expect(() => p({ indent })).toThrow(RangeError);
    });

    test("heading level must be 1, 2 or 3", () => {
      expect(() => schema.node("heading", { level: 4 })).toThrow(RangeError);
      expect(() => h1({ theme: 1 })).toThrow(RangeError);
    });

    test("ordered list order must be a number", () => {
      expect(() => ol({ order: "3" }, li(p()))).toThrow(RangeError);
    });

    test("links require an href", () => {
      expect(() => schema.node("link")).toThrow(RangeError);
    });

    test("colors must be twelve hex digits", () => {
      expect(mark("color", { color: COLOR }).attrs.color).toBe(COLOR);
      expect(() => mark("color", { color: "#ff0000" })).toThrow(RangeError);
      expect(() => mark("color", { color: 0xff0000 })).toThrow(RangeError);
    });

    test("fonts must be registered", () => {
      expect(mark("font", { font: FONT }).attrs.font).toBe(FONT);
      expect(() => mark("font", { font: "comic-sans" })).toThrow(RangeError);
    });
  });

  describe("content rules", () => {
    test("superscript and subscript exclude each other", () => {
      const superscript = schema.marks.superscript.create();
      const subscript = schema.marks.subscript.create();

      expect(subscript.addToSet([superscript])).toEqual([subscript]);
      expect(superscript.addToSet([subscript])).toEqual([superscript]);
    });

    test("code blocks allow no marks", () => {
      expect(schema.nodes.codeBlock.allowsMarkType(schema.marks.bold)).toBe(false);
      expect(schema.nodes.paragraph.allowsMarkType(schema.marks.bold)).toBe(true);
    });

    test("inline atoms expose their value as text", () => {
      expect(dropdown({ dropdownType: "status", value: "Done" }).textContent).toBe("Done");
      expect(mention({ userId: "user-1", displayName: "Ada" }).textContent).toBe("Ada");
    });

    test("LIST_NODES contains every list type", () => {
      expect(LIST_NODES).toEqual(
        new Set([schema.nodes.ordered_list, schema.nodes.unordered_list, schema.nodes.check_list]),
      );
    });
  });

  describe("parseDOM", () => {
    test("reads paragraph alignment, line height and indent from inline styles", () => {
      const node = parseBlock(
        '<p style="text-align: center; line-height: 2; padding-left: 32px">Hi</p>',
      );

      expect(node.toJSON()).toEqual(
        p({ align: "center", lineHeight: 2, indent: 1 }, "Hi").toJSON(),
      );
    });

    test("defaults to left alignment for unknown values", () => {
      expect(parseBlock('<p style="text-align: start">Hi</p>').attrs.align).toBe("left");
      expect(parseBlock("<p>Hi</p>").attrs.align).toBe("left");
    });

    test.each([
      ["0.5", MIN_LINE_HEIGHT],
      ["10", MAX_LINE_HEIGHT],
      ["1.5", 1.5],
      ["normal", undefined],
    ])("clamps line-height %s to %s", (value, expected) => {
      expect(parseBlock(`<p style="line-height: ${value}">Hi</p>`).attrs.lineHeight).toBe(expected);
    });

    test.each([
      ["4rem", 2],
      ["64px", 2],
      ["100rem", MAX_INDENT],
      ["1000px", MAX_INDENT],
      ["0.5rem", undefined],
      ["0", undefined],
    ])("converts padding-left %s to indent %s", (value, expected) => {
      expect(parseBlock(`<p style="padding-left: ${value}">Hi</p>`).attrs.indent).toBe(expected);
    });

    test.each([
      ["h1", h1],
      ["h2", h2],
      ["h3", h3],
    ])("parses %s with text attributes", (tag, heading) => {
      const node = parseBlock(
        `<${tag} style="text-align: right; padding-left: 2rem">Title</${tag}>`,
      );

      expect(node.toJSON()).toEqual(heading({ align: "right", indent: 1 }, "Title").toJSON());
    });

    test("parses ordered lists with a start number", () => {
      const list = parseBlock('<ol start="3"><li><p>One</p></li><li><p>Two</p></li></ol>');

      expect(list.type).toBe(schema.nodes.ordered_list);
      expect(list.attrs.order).toBe(3);
      expect(list.childCount).toBe(2);
      expect(parseBlock("<ol><li><p>One</p></li></ol>").attrs.order).toBe(1);
    });

    test("wraps bare list item text in a paragraph", () => {
      const list = parseBlock("<ul><li>One</li></ul>");

      expect(list.type).toBe(schema.nodes.unordered_list);
      expect(list.firstChild?.type).toBe(schema.nodes.list_item);
      expect(list.firstChild?.firstChild?.type).toBe(schema.nodes.paragraph);
      expect(list.textContent).toBe("One");
    });

    test("distinguishes check lists by class", () => {
      expect(parseBlock('<ul class="checklist"><li>One</li></ul>').type).toBe(
        schema.nodes.check_list,
      );
      expect(parseBlock('<ul class="other"><li>One</li></ul>').type).toBe(
        schema.nodes.unordered_list,
      );
    });

    test.each([
      ['<li role="checkbox" aria-checked="true">One</li>', true],
      ['<li role="checkbox" aria-checked="false">One</li>', false],
      ["<li>One</li>", false],
    ])("reads the checked state from %s", (item, checked) => {
      const list = parseBlock(`<ul class="checklist">${item}</ul>`);

      expect(list.firstChild?.attrs.checked).toBe(checked);
    });

    test("parses quotes, code blocks and dividers", () => {
      expect(parseBlock("<blockquote><p>Quote</p></blockquote>").toJSON()).toEqual(
        quote(p("Quote")).toJSON(),
      );
      expect(parseBlock("<pre>  indented\n  code</pre>").toJSON()).toEqual(
        codeBlock("  indented\n  code").toJSON(),
      );
      expect(parseBlock("<hr>").toJSON()).toEqual(divider().toJSON());
    });

    test("parses links with an href", () => {
      expect(parseInline('<a href="https://example.com">Site</a>').toJSON()).toEqual(
        link({ href: "https://example.com" }, "Site").toJSON(),
      );
      expect(parseInline("<a>Site</a>").isText).toBe(true);
    });

    test.each([
      ["2026-10-14", false],
      ["2026-10-14T10:30:00.000Z", true],
    ])("parses <time datetime=%s> with time=%s", (value, time) => {
      const node = parseInline(`<time datetime="${value}">${value}</time>`);

      expect(node.type).toBe(schema.nodes.date);
      expect(node.attrs).toEqual({ value, time, theme: null });
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
    ])("parses %s as the %s mark", (html, markName) => {
      const node = parseInline(html);

      expect(node.marks.map((mark) => mark.type.name)).toEqual([markName]);
    });

    test.each([
      ["16px", 1],
      ["32px", 2],
      ["2em", 2],
      ["24pt", 1],
      ["48px", MAX_TEXT_SIZE],
      ["4px", MIN_TEXT_SIZE],
    ])("parses font-size %s as size %s", (value, size) => {
      const node = parseInline(`<span style="font-size: ${value}">x</span>`);

      expect(node.marks).toEqual([mark("size", { size })]);
    });

    test("ignores unparseable font sizes", () => {
      expect(parseInline('<span style="font-size: huge">x</span>').marks).toEqual([]);
    });
  });

  describe("toDOM", () => {
    test("renders paragraphs with alignment and style", () => {
      expect(toHTML(p("Hi"))).toBe('<p class="left">Hi</p>');

      const styled = render(p({ align: "center", lineHeight: 2, indent: 1 }, "Hi"));
      expect(styled.className).toBe("center");
      expect(styled.style.lineHeight).toBe("2");
      expect(styled.style.getPropertyValue("--indent")).toBe("1");
      expect(styled.textContent).toBe("Hi");
    });

    test("renders headings at their level", () => {
      expect(toHTML(h1("Title"))).toBe('<h1 class="left">Title</h1>');

      const styled = render(h3({ align: "right", indent: 2 }, "Title"));
      expect(styled.tagName).toBe("H3");
      expect(styled.className).toBe("right");
      expect(styled.getAttribute("style")).toBe("--indent: 2;");
    });

    test("renders list containers", () => {
      expect(schema.nodes.ordered_list.spec.toDOM?.(ol(li(p())))).toEqual(["ol", 0]);
      expect(schema.nodes.ordered_list.spec.toDOM?.(ol({ order: 3 }, li(p())))).toEqual([
        "ol",
        { start: 3 },
        0,
      ]);
      expect(schema.nodes.unordered_list.spec.toDOM?.(ul(li(p())))).toEqual(["ul", 0]);
      expect(schema.nodes.check_list.spec.toDOM?.(cl(li(p())))).toEqual([
        "ul",
        { class: "checklist" },
        0,
      ]);
    });

    test("renders block containers", () => {
      expect(toHTML(quote(p("Quote")))).toBe('<blockquote><p class="left">Quote</p></blockquote>');
      expect(toHTML(pendingBlock(p("Draft")))).toBe('<ins><p class="left">Draft</p></ins>');
      expect(toHTML(codeBlock("code"))).toBe("<pre><code>code</code></pre>");
      expect(toHTML(divider())).toBe("<hr>");
    });

    test("renders links", () => {
      expect(toHTML(p(link({ href: "https://example.com" }, "Site")))).toBe(
        '<p class="left"><a href="https://example.com">Site</a></p>',
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
    ] as const)("renders the %s mark", (markName, html) => {
      expect(toHTML(text("x", mark(markName)))).toBe(html);
    });

    test("renders size, color and font marks as inline styles", () => {
      expect(schema.marks.size.spec.toDOM?.(mark("size", { size: 1.5 }), true)).toEqual([
        "span",
        { style: "font-size: 1.50em" },
        0,
      ]);
      expect(schema.marks.color.spec.toDOM?.(mark("color", { color: COLOR }), true)).toEqual([
        "span",
        { style: `color: ${toCSSColor(COLOR)}` },
        0,
      ]);
      expect(schema.marks.font.spec.toDOM?.(mark("font", { font: FONT }), true)).toEqual([
        "span",
        { style: 'font-family: "Lora"' },
        0,
      ]);
    });

    test("nodes rendered by node views have no toDOM", () => {
      for (const name of ["list_item", "date", "dropdown", "mention"] as const) {
        expect(schema.nodes[name].spec.toDOM).toBeUndefined();
      }
    });
  });

  describe("round trips", () => {
    // Alignment and indent are rendered as a class and a custom property for the app's own
    // stylesheet, so only the remaining nodes, marks and attrs survive a parse of rendered HTML.
    test("parsing rendered HTML reproduces nodes, marks and line height", () => {
      const content = doc(
        h2("Title"),
        p(
          { lineHeight: 1.5 },
          "Plain ",
          text("bold", mark("bold")),
          " and ",
          text("big", mark("size", { size: 2 })),
        ),
        quote(p("Quoted")),
        codeBlock("const x = 1;"),
        divider(),
        p(link({ href: "https://example.com" }, "Link")),
      );

      expect(parseHTML(toHTML(content.content)).toJSON()).toEqual(content.toJSON());
    });
  });
});
