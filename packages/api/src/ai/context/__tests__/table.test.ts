import { describe, expect, test } from "vitest";
import { toMarkdownTable } from "../table";
import { TABLE_TILE, EMPTY_TABLE_TILE } from "@/test/fixtures/Tile";

describe("toMarkdownTable", () => {
  test("returns empty string for table with no columns", () => {
    expect(toMarkdownTable(EMPTY_TABLE_TILE)).toBe("");
  });

  test("formats a table with headers and data", () => {
    expect(toMarkdownTable(TABLE_TILE)).toBe(
      "| Name | Age |\n| --- | --- |\n| Alice | 30 |\n| Bob | 25 |",
    );
  });

  test("indicates when there are more rows", () => {
    const tileWithMoreRows = {
      ...TABLE_TILE,
      numRows: 15,
    };
    expect(toMarkdownTable(tileWithMoreRows)).toBe(
      "| Name | Age |\n| --- | --- |\n| Alice | 30 |\n| Bob | 25 |\n(13 more rows)",
    );
  });
});
