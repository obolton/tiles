import { describe, expect, test } from "vitest";
import { jsx } from "../jsx";
import { renderToString } from "../server";
import { ReactiveValue } from "@/utils/reactivity";
import { BOOLEAN_STRING_ATTRIBUTES } from "../attributes";
import type { JSX } from "../jsx";

describe("renderToString", () => {
  test("renders an element to a string", () => {
    const element = jsx("div", {});
    expect(renderToString(element)).toBe("<div></div>");
  });

  test.for([
    "area",
    "base",
    "br",
    "col",
    "embed",
    "hr",
    "img",
    "input",
    "link",
    "meta",
    "source",
    "track",
    "wbr",
  ])("renders %s as a void element", (tag) => {
    const element = jsx(tag as JSX.ElementType, {});
    expect(renderToString(element)).toBe(`<${tag}>`);
  });

  test("renders a string attribute", () => {
    const element = jsx("div", {
      title: "test",
    });
    expect(renderToString(element)).toBe('<div title="test"></div>');
  });

  test("escapes the string attribute", () => {
    const element = jsx("div", {
      title: '"test<>',
    });
    expect(renderToString(element)).toBe(
      '<div title="&quot;test&lt;&gt;"></div>',
    );
  });

  test("renders a numeric attribute", () => {
    const element = jsx("div", {
      tabindex: 0,
    });
    expect(renderToString(element)).toBe('<div tabindex="0"></div>');
  });

  test("renders a true boolean attribute", () => {
    const element = jsx("input", {
      checked: true,
    });
    expect(renderToString(element)).toBe("<input checked>");
  });

  describe("boolean string attributes", () => {
    describe.for(Array.from(BOOLEAN_STRING_ATTRIBUTES))("%s", (attribute) => {
      test("truthy value", () => {
        const element = jsx("div", { [attribute]: 1 });
        expect(renderToString(element)).toBe(`<div ${attribute}="true"></div>`);
      });

      test("falsy value", () => {
        const element = jsx("div", { [attribute]: 0 });
        expect(renderToString(element)).toBe(
          `<div ${attribute}="false"></div>`,
        );
      });

      test("false", () => {
        const element = jsx("div", { [attribute]: "false" });
        expect(renderToString(element)).toBe(
          `<div ${attribute}="false"></div>`,
        );
      });

      test("string value", () => {
        const element = jsx("div", { [attribute]: "page" });
        expect(renderToString(element)).toBe(`<div ${attribute}="page"></div>`);
      });
    });
  });

  test("renders a reactive attribute", () => {
    const store = new ReactiveValue(false);
    const element = jsx("input", {
      checked: store,
    });
    expect(renderToString(element)).toBe("<input>");
    store.value = true;
    expect(renderToString(element)).toBe("<input checked>");
  });

  test("ignores a false boolean attribute", () => {
    const element = jsx("input", {
      checked: false,
    });
    expect(renderToString(element)).toBe("<input>");
  });

  test("ignores an undefined attribute", () => {
    const element = jsx("div", {
      id: undefined,
    });
    expect(renderToString(element)).toBe("<div></div>");
  });

  test("ignores a property", () => {
    const element = jsx("div", {
      $className: "foo",
    });
    expect(renderToString(element)).toBe("<div></div>");
  });

  test("renders a child text node", () => {
    const element = jsx("p", {
      children: "Hello world",
    });
    expect(renderToString(element)).toBe("<p>Hello world</p>");
  });

  test("escapes HTML metacharacters in a child text node", () => {
    const element = jsx("p", {
      children: "<script>alert('xss & pwn')</script>",
    });
    expect(renderToString(element)).toBe(
      "<p>&lt;script&gt;alert('xss &amp; pwn')&lt;/script&gt;</p>",
    );
  });

  test("escapes HTML metacharacters in fragment children", () => {
    const element = jsx("p", {
      children: ["<a>", " & ", "<b>"],
    });
    expect(renderToString(element)).toBe("<p>&lt;a&gt; &amp; &lt;b&gt;</p>");
  });

  test("renders a child element node", () => {
    const element = jsx("p", {
      children: jsx("span", { children: "Hello world" }),
    });
    expect(renderToString(element)).toBe("<p><span>Hello world</span></p>");
  });

  test("renders a child component", () => {
    const Component = ({ name }: { name: string }) =>
      jsx("span", { children: `Hello ${name}` });

    const element = jsx("p", {
      children: jsx(Component, { name: "Test" }),
    });
    expect(renderToString(element)).toBe("<p><span>Hello Test</span></p>");
  });

  test("renders multiple child nodes", () => {
    const element = jsx("p", {
      children: [
        jsx("span", { children: "Foo" }),
        "Bar",
        jsx("span", { children: "Baz" }),
      ],
    });
    expect(renderToString(element)).toBe(
      "<p><span>Foo</span>Bar<span>Baz</span></p>",
    );
  });

  test("renders a style attribute", () => {
    const element = jsx("div", {
      style: {
        color: "#000",
        backgroundColor: "red",
        padding: "0",
      },
    });
    expect(renderToString(element)).toBe(
      '<div style="color:#000;background-color:red;padding:0"></div>',
    );
  });

  test("renders a class component", () => {
    class Component {
      name: string;

      constructor({ name }: { name: string }) {
        this.name = name;
      }

      render() {
        return jsx("span", { children: `Hello ${this.name}` });
      }
    }

    const element = jsx(Component, { name: "Test" });
    expect(renderToString(element)).toBe("<span>Hello Test</span>");
  });

  test("renders deeply nested elements without causing a stack overflow", () => {
    let element: JSX.Element = jsx("span", { children: "leaf" });
    for (let i = 0; i < 50_000; i++) {
      element = jsx("div", { children: element });
    }
    const html = renderToString(element);
    expect(html.startsWith("<div>".repeat(50_000))).toBe(true);
    expect(html.endsWith("</div>".repeat(50_000))).toBe(true);
    expect(html).toContain("<span>leaf</span>");
  });
});
