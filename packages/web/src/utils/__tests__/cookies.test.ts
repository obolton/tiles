import { describe, expect, test } from "vitest";
import { getCookie } from "../cookies";

describe("getCookie", () => {
  test("returns the value of the cookie", () => {
    const cookies = "test=123; abc=def";
    expect(getCookie(cookies, "test")).toBe("123");
  });

  test("returns null if the cookie does not exist", () => {
    const cookies = "test=123; abc=def";
    expect(getCookie(cookies, "nonexistent")).toBeNull();
  });

  test("returns an empty value", () => {
    const cookies = "test=; abc=def";
    expect(getCookie(cookies, "test")).toBe("");
  });

  test("returns null for an empty cookie string", () => {
    expect(getCookie("", "test")).toBeNull();
  });

  test("preserves values containing an equals sign", () => {
    const cookies = "token=abc==; abc=def";
    expect(getCookie(cookies, "token")).toBe("abc==");
  });

  test("decodes encoded values", () => {
    const cookies = "test=hello%20world";
    expect(getCookie(cookies, "test")).toBe("hello world");
  });

  test("returns the raw value when decoding fails", () => {
    const cookies = "test=100%";
    expect(getCookie(cookies, "test")).toBe("100%");
  });
});
