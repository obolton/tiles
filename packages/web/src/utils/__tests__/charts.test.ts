import { describe, expect, test } from "vitest";
import { isNumericColumn, toCellText, toNumber } from "@/utils/charts";
import type { RichText } from "doc/types/richText";

const RICH_TEXT: RichText = [
  { type: "paragraph", children: [{ type: "text", format: 0, text: " 1,250 " }] },
];

describe("toCellText", () => {
  test("returns trimmed text and the plain text of rich text", () => {
    expect(toCellText(" Q1 ")).toBe("Q1");
    expect(toCellText(RICH_TEXT)).toBe("1,250");
  });

  test("returns null for empty cells", () => {
    expect(toCellText(null)).toBeNull();
    expect(toCellText(undefined)).toBeNull();
    expect(toCellText("  ")).toBeNull();
  });
});

describe("toNumber", () => {
  test("parses plain and formatted numbers", () => {
    expect(toNumber("42")).toBe(42);
    expect(toNumber("-3.5")).toBe(-3.5);
    expect(toNumber(RICH_TEXT)).toBe(1250);
  });

  test("returns null for empty and non-numeric cells", () => {
    expect(toNumber(null)).toBeNull();
    expect(toNumber("")).toBeNull();
    expect(toNumber("Q1")).toBeNull();
    expect(toNumber("12 apples")).toBeNull();
  });
});

describe("isNumericColumn", () => {
  test("accepts columns of numbers with empty cells", () => {
    expect(isNumericColumn(["1", null, "2.5", ""])).toBe(true);
  });

  test("rejects columns with text or no values", () => {
    expect(isNumericColumn(["1", "Q2"])).toBe(false);
    expect(isNumericColumn([null, ""])).toBe(false);
    expect(isNumericColumn([])).toBe(false);
  });
});
