import { describe, expect, test } from "vitest";
import { getPageDescription } from "../pages";
import { PAGE } from "@/test/fixtures/Page";

describe("getPageDescription", () => {
  test("describes the page type and author", () => {
    expect(getPageDescription({ ...PAGE, type: "PRESENTATION" })).toBe(
      "A presentation by Test User, created with Tiles.",
    );
    expect(getPageDescription({ ...PAGE, type: "DOCUMENT" })).toBe(
      "A document by Test User, created with Tiles.",
    );
    expect(getPageDescription({ ...PAGE, type: "COLLECTION" })).toBe(
      "A collection by Test User, created with Tiles.",
    );
    expect(getPageDescription({ ...PAGE, type: "FREE" })).toBe(
      "A page by Test User, created with Tiles.",
    );
  });
});
