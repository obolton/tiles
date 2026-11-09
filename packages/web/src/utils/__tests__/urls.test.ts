import { describe, expect, test } from "vitest";
import { formatUrl, setSearchParams } from "../urls";

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

describe("formatUrl", () => {
  test("drops the scheme", () => {
    expect(formatUrl("https://example.com/docs")).toBe("example.com/docs");
    expect(formatUrl("http://example.com/docs")).toBe("example.com/docs");
  });

  test("drops a trailing slash from a bare origin", () => {
    expect(formatUrl("https://example.com")).toBe("example.com");
    expect(formatUrl("https://example.com/")).toBe("example.com");
  });

  test("keeps the port, query and fragment", () => {
    expect(formatUrl("http://localhost:3000/pages?sort=title#top")).toBe(
      "localhost:3000/pages?sort=title#top",
    );
  });

  test("returns other schemes and invalid URLs unchanged", () => {
    expect(formatUrl("mailto:hello@example.com")).toBe("mailto:hello@example.com");
    expect(formatUrl("not a url")).toBe("not a url");
  });
});
