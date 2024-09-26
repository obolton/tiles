import { describe, expect, test } from "vitest";
import { getCookie } from "../cookies";

describe("getCookie", () => {
  test("returns the value of the cookie", () => {
    document.cookie = "test=123; abc=def";
    expect(getCookie("test")).toBe("123");
  });

  test("returns null if the cookie does not exist", () => {
    document.cookie = "test=123; abc=def";
    expect(getCookie("nonexistent")).toBe(null);
  });

  test("returns an empty value", () => {
    document.cookie = "test=; abc=def";
    expect(getCookie("test")).toBe("");
  });
});
