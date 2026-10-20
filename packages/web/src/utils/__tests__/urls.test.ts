import { describe, expect, test } from "vitest";
import { setSearchParams } from "../urls";

describe("setSearchParams", () => {
  test("adds search params to the URL", () => {
    const src = "https://example.com";
    const params = { foo: "bar", baz: "qux" };
    const result = setSearchParams(src, params);
    expect(result).toBe("https://example.com/?foo=bar&baz=qux");
  });

  test("overrides search params", () => {
    const src = "https://example.com?foo=bar";
    const params = { foo: "new", baz: "qux" };
    const result = setSearchParams(src, params);
    expect(result).toBe("https://example.com/?foo=new&baz=qux");
  });

  test("maintains existing search params", () => {
    const src = "https://example.com?foo=bar&baz=qux";
    const params = { foo: "new" };
    const result = setSearchParams(src, params);
    expect(result).toBe("https://example.com/?foo=new&baz=qux");
  });
});
