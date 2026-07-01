import { describe, expect, test } from "vitest";
import { isEmptyNode, isTextNode, isElementNode, toNodeArray } from "../node-types";
import { jsx } from "../jsx";

describe("isEmptyNode", () => {
  test("returns true for true", () => {
    expect(isEmptyNode(true)).toBe(true);
  });

  test("returns true for false", () => {
    expect(isEmptyNode(false)).toBe(true);
  });

  test("returns true for null", () => {
    expect(isEmptyNode(null)).toBe(true);
  });

  test("returns true for undefined", () => {
    expect(isEmptyNode(undefined)).toBe(true);
  });

  test("returns false for empty string", () => {
    expect(isEmptyNode("")).toBe(false);
  });

  test("returns false for non-empty string", () => {
    expect(isEmptyNode("hello")).toBe(false);
  });

  test("returns false for zero", () => {
    expect(isEmptyNode(0)).toBe(false);
  });

  test("returns false for non-zero number", () => {
    expect(isEmptyNode(42)).toBe(false);
  });

  test("returns false for JSX element", () => {
    expect(isEmptyNode(jsx("div", {}))).toBe(false);
  });
});

describe("isTextNode", () => {
  test("returns true for empty string", () => {
    expect(isTextNode("")).toBe(true);
  });

  test("returns true for non-empty string", () => {
    expect(isTextNode("hello")).toBe(true);
  });

  test("returns true for zero", () => {
    expect(isTextNode(0)).toBe(true);
  });

  test("returns true for positive number", () => {
    expect(isTextNode(42)).toBe(true);
  });

  test("returns true for negative number", () => {
    expect(isTextNode(-1.5)).toBe(true);
  });

  test("returns true for bigint", () => {
    expect(isTextNode(BigInt(123))).toBe(true);
  });

  test("returns false for true", () => {
    expect(isTextNode(true)).toBe(false);
  });

  test("returns false for false", () => {
    expect(isTextNode(false)).toBe(false);
  });

  test("returns false for null", () => {
    expect(isTextNode(null)).toBe(false);
  });

  test("returns false for undefined", () => {
    expect(isTextNode(undefined)).toBe(false);
  });

  test("returns false for JSX element", () => {
    expect(isTextNode(jsx("div", {}))).toBe(false);
  });
});

describe("isElementNode", () => {
  test("returns true for JSX element", () => {
    expect(isElementNode(jsx("div", {}))).toBe(true);
  });

  test("returns true for JSX element with children", () => {
    expect(isElementNode(jsx("span", { children: "text" }))).toBe(true);
  });

  test("returns false for string", () => {
    expect(isElementNode("text")).toBe(false);
  });

  test("returns false for number", () => {
    expect(isElementNode(42)).toBe(false);
  });

  test("returns false for null", () => {
    expect(isElementNode(null)).toBe(false);
  });

  test("returns false for undefined", () => {
    expect(isElementNode(undefined)).toBe(false);
  });

  test("returns false for empty array", () => {
    expect(isElementNode([])).toBe(false);
  });

  test("returns false for array with elements", () => {
    expect(isElementNode([jsx("div", {})])).toBe(false);
  });

  test("returns false for empty object", () => {
    // @ts-expect-error Invalid value
    expect(isElementNode({})).toBe(false);
  });

  test("returns false for object without type property", () => {
    // @ts-expect-error Invalid value
    expect(isElementNode({ properties: {} })).toBe(false);
  });
});

describe("toNodeArray", () => {
  test("returns an empty array for null", () => {
    expect(toNodeArray(null)).toEqual([]);
  });

  test("returns an empty array for undefined", () => {
    expect(toNodeArray(undefined)).toEqual([]);
  });

  test("returns an empty array for true", () => {
    expect(toNodeArray(true)).toEqual([]);
  });

  test("returns an empty array for false", () => {
    expect(toNodeArray(false)).toEqual([]);
  });

  test("returns the same array for an array input", () => {
    const nodes = [jsx("span", {}), jsx("p", {})];
    expect(toNodeArray(nodes)).toBe(nodes);
  });

  test("returns an empty array as-is", () => {
    const nodes: never[] = [];
    expect(toNodeArray(nodes)).toBe(nodes);
  });

  test("wraps a JSX element in an array", () => {
    const element = jsx("div", {});
    expect(toNodeArray(element)).toEqual([element]);
  });

  test("wraps a string in an array", () => {
    expect(toNodeArray("hello")).toEqual(["hello"]);
  });

  test("wraps an empty string in an array", () => {
    expect(toNodeArray("")).toEqual([""]);
  });

  test("wraps a number in an array", () => {
    expect(toNodeArray(42)).toEqual([42]);
  });

  test("wraps zero in an array", () => {
    expect(toNodeArray(0)).toEqual([0]);
  });
});
