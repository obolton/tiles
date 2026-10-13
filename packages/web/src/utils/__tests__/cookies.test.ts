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
});
