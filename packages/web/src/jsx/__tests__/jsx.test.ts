import { describe, expect, test } from "vitest";
import { jsx, Fragment } from "../jsx";

describe("jsx", () => {
  test("creates an element with the given type", () => {
    const element = jsx("div", {});
    expect(element).toEqual({
      type: "div",
      properties: {},
      children: undefined,
      key: undefined,
    });
  });

  test("sets the properties of the element", () => {
    const element = jsx("div", { id: "test-id", className: "test-class" });
    expect(element).toEqual({
      type: "div",
      properties: {
        id: "test-id",
        className: "test-class",
      },
      children: undefined,
      key: undefined,
    });
  });

  test("adds a child element", () => {
    const element = jsx("div", { children: jsx("span", {}) });
    expect(element).toEqual({
      type: "div",
      properties: {
        children: {
          type: "span",
          properties: {},
          children: undefined,
          key: undefined,
        },
      },
      key: undefined,
    });
  });

  test("adds multiple children", () => {
    const element = jsx("div", { children: [jsx("span", {}), jsx("p", {})] });
    expect(element).toEqual({
      type: "div",
      properties: {
        children: [
          {
            type: "span",
            properties: {},
            children: undefined,
            key: undefined,
          },
          {
            type: "p",
            properties: {},
            children: undefined,
            key: undefined,
          },
        ],
      },
      key: undefined,
    });
  });

  test("adds a child text node", () => {
    const element = jsx("div", { children: "Hello World" });
    expect(element).toEqual({
      type: "div",
      properties: { children: "Hello World" },
      key: undefined,
    });
  });
});

describe("Fragment", () => {
  test("returns the fragment's children", () => {
    const children = [jsx("div", {}), jsx("div", {})];
    const fragment = Fragment({ children });
    expect(fragment).toEqual(children);
  });
});
