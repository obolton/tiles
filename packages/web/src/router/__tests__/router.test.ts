import { describe, expect, test, vi } from "vitest";
import Router from "../router";

function mockRoute(id: string) {
  return {
    loader: vi.fn(),
    moduleId: id,
  };
}

const INDEX = mockRoute("index");
const INDEX_WILDCARD = mockRoute("index-wildcard");
const FOO_WILDCARD = mockRoute("foo-wildcard");
const FOO = mockRoute("foo");
const BAR = mockRoute("bar");
const ABC = mockRoute("abc");
const GHI = mockRoute("ghi");

const router = new Router();
router.add("/", INDEX);
router.add("/foo", FOO);
router.add("/foo/*", FOO_WILDCARD);
router.add("/bar", BAR);
router.add("/bar/abc", ABC);
router.add("/bar/def/ghi", GHI);
router.add("/*", INDEX_WILDCARD);

describe("Router", () => {
  test("matches the index for an empty path", () => {
    expect(router.match("/")).toBe(INDEX);
  });

  test("matches the index for an empty string", () => {
    expect(router.match("")).toBe(INDEX);
  });

  test("matches a named route", () => {
    expect(router.match("/foo")).toBe(FOO);
  });

  test("matches a root wildcard route", () => {
    expect(router.match("/other")).toBe(INDEX_WILDCARD);
  });

  test("matches a nested wildcard route", () => {
    expect(router.match("/foo/other")).toBe(FOO_WILDCARD);
  });

  test("matches a child route index", () => {
    expect(router.match("/bar")).toBe(BAR);
  });

  test("returns null if the path does not match a route", () => {
    expect(router.match("/bar/non-existent")).toBeNull();
  });

  test("matches a nested route", () => {
    expect(router.match("/bar/abc")).toBe(ABC);
  });

  test("matches a deeply nested route", () => {
    expect(router.match("/bar/def/ghi")).toBe(GHI);
  });

  test("returns null if the path does not match a deeply nested subroute", () => {
    expect(router.match("/bar/def/ghi/other")).toBeNull();
  });
});
