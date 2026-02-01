import { describe, expect, test } from "vitest";
import { classNames, classList } from "../css";

describe("classNames", () => {
  test("joins class names", () => {
    expect(classNames("a", "b", "c")).toBe("a b c");
  });

  test("filters out undefined, null and false values", () => {
    expect(classNames("a", undefined, "b", null, "c", false)).toBe("a b c");
  });

  test("filters out empty strings", () => {
    expect(classNames("a", "", "b", "c")).toBe("a b c");
  });

  test("returns an empty string if no valid class names are provided", () => {
    expect(classNames(null, undefined, "")).toBe("");
  });
});

describe("classList", () => {
  test("merges multiple classList objects", () => {
    const result = classList({ a: true, b: false }, { c: true });
    expect(result).toEqual({ a: true, b: false, c: true });
  });

  test("later sources override earlier ones", () => {
    const result = classList({ a: true }, { a: false });
    expect(result).toEqual({ a: false });
  });

  test("ignores falsy sources", () => {
    const result = classList({ a: true }, null, undefined, false, { b: true });
    expect(result).toEqual({ a: true, b: true });
  });

  test("returns empty object for no sources", () => {
    const result = classList();
    expect(result).toEqual({});
  });
});
