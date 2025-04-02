import { describe, expect, test } from "vitest";
import { jsx } from "../jsx";
import { renderToString } from "../server";

describe("renderToString", () => {
  test("renders an element to a string", () => {
    const element = jsx("div", {});
    expect(renderToString(element)).toBe("<div />");
  });

  test("renders a string attribute", () => {
    const element = jsx("div", {
      title: "test",
    });
    expect(renderToString(element)).toBe('<div title="test" />');
  });

  test("escapes the string attribute", () => {
    const element = jsx("div", {
      title: '"test<>',
    });
    expect(renderToString(element)).toBe('<div title="&quot;test&lt;&gt;" />');
  });

  test("renders a numeric attribute", () => {
    const element = jsx("div", {
      tabIndex: 0,
    });
    expect(renderToString(element)).toBe('<div tabindex="0" />');
  });

  test("renders a true boolean attribute", () => {
    const element = jsx("input", {
      checked: true,
    });
    expect(renderToString(element)).toBe("<input checked />");
  });

  test("ignores a false boolean attribute", () => {
    const element = jsx("input", {
      checked: false,
    });
    expect(renderToString(element)).toBe("<input />");
  });

  test("ignores an undefined attribute", () => {
    const element = jsx("div", {
      id: undefined,
    });
    expect(renderToString(element)).toBe("<div />");
  });

  test("renders a child text node", () => {
    const element = jsx("p", {
      children: "Hello world",
    });
    expect(renderToString(element)).toBe("<p>Hello world</p>");
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
});
