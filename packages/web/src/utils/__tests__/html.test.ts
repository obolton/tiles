import { describe, expect, test } from "vitest";
import { VOID_ELEMENTS, escapeTagContents, tag } from "../html";

describe("tag", () => {
  test("returns just the open tag for void elements", () => {
    expect(tag("link", { rel: "stylesheet", href: "/style.css" })).toBe(
      `<link rel="stylesheet" href="/style.css">`,
    );
    expect(tag("meta", { charset: "utf-8" })).toBe(`<meta charset="utf-8">`);
    expect(tag("br", {})).toBe("<br>");
  });

  test("wraps non-void elements with a closing tag", () => {
    expect(tag("title", {}, "Hello")).toBe("<title>Hello</title>");
  });

  test("emits an empty close for non-void elements with no content", () => {
    expect(tag("script", { src: "/main.js" })).toBe(
      `<script src="/main.js"></script>`,
    );
  });

  test("escapes attribute values", () => {
    expect(tag("a", { href: `https://x.test/?a="b"&c` })).toBe(
      `<a href="https://x.test/?a=&quot;b&quot;&amp;c"></a>`,
    );
  });

  test("emits boolean attributes without a value when true", () => {
    expect(tag("link", { rel: "preload", crossorigin: true })).toBe(
      `<link rel="preload" crossorigin>`,
    );
  });

  test("omits boolean attributes when false", () => {
    expect(tag("link", { rel: "preload", crossorigin: false })).toBe(
      `<link rel="preload">`,
    );
  });

  test("omits attributes when value is undefined", () => {
    expect(
      tag("link", { rel: "preload", as: undefined, type: undefined }),
    ).toBe(`<link rel="preload">`);
  });

  test("serializes number attribute values", () => {
    expect(tag("input", { type: "number", maxlength: 32 })).toBe(
      `<input type="number" maxlength="32">`,
    );
  });

  test("ignores content for void elements", () => {
    expect(tag("link", { rel: "preload" }, "ignored")).toBe(
      `<link rel="preload">`,
    );
  });

  test("does not escape content (caller's responsibility)", () => {
    expect(tag("style", {}, "@font-face{font-family:Inter}")).toBe(
      `<style>@font-face{font-family:Inter}</style>`,
    );
  });

  test("emits opening tag with no whitespace when there are no attributes", () => {
    expect(tag("style", {}, "")).toBe("<style></style>");
  });
});

describe("escapeTagContents", () => {
  test("escapes </ to <\\/", () => {
    expect(escapeTagContents("</style>")).toBe("<\\/style>");
  });

  test("escapes every occurrence", () => {
    expect(escapeTagContents("a</b>c</d>")).toBe("a<\\/b>c<\\/d>");
  });

  test("leaves other characters untouched", () => {
    expect(escapeTagContents("@font-face { font-family: Inter; }")).toBe(
      "@font-face { font-family: Inter; }",
    );
  });

  test("does not escape lone `<` or `/`", () => {
    expect(escapeTagContents("a < b / c")).toBe("a < b / c");
  });
});

describe("VOID_ELEMENTS", () => {
  test("includes the standard HTML void elements", () => {
    for (const name of ["link", "meta", "br", "img", "input"]) {
      expect(VOID_ELEMENTS.has(name)).toBe(true);
    }
  });

  test("excludes elements that have content", () => {
    for (const name of ["div", "span", "script", "style", "title"]) {
      expect(VOID_ELEMENTS.has(name)).toBe(false);
    }
  });
});
