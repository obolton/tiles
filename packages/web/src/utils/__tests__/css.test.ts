import { describe, expect, test } from "vitest";
import { classNames, serializeStyles, transformCSSProperty } from "../css";

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

describe("transformCSSProperty", () => {
  test("converts camelCase to kebab-case", () => {
    expect(transformCSSProperty("backgroundColor")).toBe("background-color");
    expect(transformCSSProperty("marginTop")).toBe("margin-top");
  });
});

describe("serializeStyles", () => {
  test("serializes string and number values", () => {
    expect(
      serializeStyles({
        backgroundColor: "red",
        marginTop: 12,
      }),
    ).toBe("background-color:red;margin-top:12");
  });

  test("ignores null and undefined values", () => {
    expect(
      serializeStyles({
        display: undefined,
        nested: null,
        opacity: 1,
      }),
    ).toBe("opacity:1");
  });
});
