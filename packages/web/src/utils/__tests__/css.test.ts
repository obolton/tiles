import { describe, expect, test } from "vitest";
import { classNames } from "../css";

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
