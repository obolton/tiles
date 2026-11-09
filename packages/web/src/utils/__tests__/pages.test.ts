import { describe, expect, test } from "vitest";
import { getPageDescription, getPublicPageUrl } from "../pages";
import { PAGE } from "@/test/fixtures/Page";

describe("getPageDescription", () => {
  test("describes the page type and author", () => {
    expect(getPageDescription({ ...PAGE, type: "PRESENTATION" })).toBe(
      "A presentation by Test User, created with Tiles.",
    );
    expect(getPageDescription({ ...PAGE, type: "DOCUMENT" })).toBe(
      "A document by Test User, created with Tiles.",
    );
    expect(getPageDescription({ ...PAGE, type: "LAYOUT" })).toBe(
      "A page by Test User, created with Tiles.",
    );
  });
});

describe("getPublicPageUrl", () => {
  test("resolves the page path against the given origin", () => {
    expect(getPublicPageUrl("page-id", "https://tiles.test")).toBe(
      "https://tiles.test/pages/page-id",
    );
  });

  test("defaults to the current origin", () => {
    expect(getPublicPageUrl("page-id")).toBe(`${location.origin}/pages/page-id`);
  });
});
