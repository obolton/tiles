import { describe, expect, test, vi } from "vitest";
import Router from "../router";

const INDEX = vi.fn();
const RESOLVE = vi.fn();
const FOO = vi.fn();
const BAR = vi.fn();
const ABC = vi.fn();
const GHI = vi.fn();

const router = new Router({
  index: INDEX,
  routes: {
    foo: FOO,
    bar: new Router({
      index: BAR,
      routes: {
        abc: ABC,
        def: new Router({
          routes: {
            ghi: GHI,
          },
        }),
      },
    }),
  },
  resolve: RESOLVE,
});

describe("Router", () => {
  test("matches the index for an empty path", () => {
    expect(router.match([])).toBe(INDEX);
  });

  test("matches the index for an empty string", () => {
    expect(router.match([""])).toBe(INDEX);
  });

  test("matches a named route", () => {
    expect(router.match(["foo"])).toBe(FOO);
  });

  test("returns null if the path does not match a route", () => {
    expect(router.match(["foo", "non-existent"])).toBeNull();
  });

  test("matches a dynamic route", () => {
    expect(router.match(["other"])).toBe(RESOLVE);
  });

  test("matches a named subroute index", () => {
    expect(router.match(["bar"])).toBe(BAR);
  });

  test("matches a named subroute", () => {
    expect(router.match(["bar", "abc"])).toBe(ABC);
  });

  test("matches a deeply nested subroute", () => {
    expect(router.match(["bar", "def", "ghi"])).toBe(GHI);
  });

  test("returns null if the path does not match a deeply nested subroute", () => {
    expect(router.match(["bar", "def", "ghi", "other"])).toBeNull();
  });
});
