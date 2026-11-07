import { describe, expect, test, vi } from "vitest";
import Router from "../router";

function mockRoute(moduleUrl: string) {
  return {
    import: vi.fn(),
    moduleUrl,
  };
}

const INDEX = mockRoute("index");
const INDEX_DYNAMIC = mockRoute("index-dynamic");
const FOO_DYNAMIC = mockRoute("foo-dynamic");
const FOO = mockRoute("foo");
const BAR = mockRoute("bar");
const ABC = mockRoute("abc");
const GHI = mockRoute("ghi");
const NOT_FOUND = mockRoute("404");

const router = new Router();
router.add("/", INDEX);
router.add("/foo", FOO);
router.add("/:id", INDEX_DYNAMIC);
router.add("/:id/nested/:name", FOO_DYNAMIC);
router.add("/bar", BAR);
router.add("/bar/abc", ABC);
router.add("/bar/def/ghi", GHI);
router.addErrorRoute(404, NOT_FOUND);

describe("Router", () => {
  test("matches the index for an empty path", () => {
    expect(router.match("/")).toEqual({ route: INDEX, parameters: {} });
  });

  test("matches the index for an empty string", () => {
    expect(router.match("")).toEqual({ route: INDEX, parameters: {} });
  });

  test("matches a named route", () => {
    expect(router.match("/foo")).toEqual({ route: FOO, parameters: {} });
  });

  test("matches a dynamic route", () => {
    expect(router.match("/other")).toEqual({
      route: INDEX_DYNAMIC,
      parameters: { id: "other" },
    });
  });

  test("matches a nested dynamic route", () => {
    expect(router.match("/123/nested/other")).toEqual({
      route: FOO_DYNAMIC,
      parameters: { id: "123", name: "other" },
    });
  });

  test("matches a child route index", () => {
    expect(router.match("/bar")).toEqual({ route: BAR, parameters: {} });
  });

  test("returns null if the path does not match a route", () => {
    expect(router.match("/bar/non-existent")).toBeNull();
  });

  test("matches a nested route", () => {
    expect(router.match("/bar/abc")).toEqual({ route: ABC, parameters: {} });
  });

  test("matches a deeply nested route", () => {
    expect(router.match("/bar/def/ghi")).toEqual({
      route: GHI,
      parameters: {},
    });
  });

  test("returns null if the path does not match a deeply nested subroute", () => {
    expect(router.match("/bar/def/ghi/other")).toBeNull();
  });

  test("returns the error route for a status", () => {
    expect(router.getErrorRoute(404)).toBe(NOT_FOUND);
  });

  test("returns null if there is no error route for a status", () => {
    expect(router.getErrorRoute(500)).toBeNull();
  });
});
