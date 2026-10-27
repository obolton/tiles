import { describe, expect, test } from "vitest";
import { SESSION_COOKIE_NAME } from "@/constants/cookies";
import { createResponse } from "@/test/mocks/http";
import { clearSessionCookie, getCookie } from "../cookies";

describe("getCookie", () => {
  test("returns the value of the named cookie", () => {
    expect(getCookie("a=1; b=2", "b")).toBe("2");
  });

  test("returns null when the cookie is missing", () => {
    expect(getCookie("a=1", "b")).toBeNull();
  });

  test("returns null for an empty cookie header", () => {
    expect(getCookie("", "a")).toBeNull();
  });

  test("decodes URL-encoded values", () => {
    expect(getCookie("a=%20x%3B", "a")).toBe(" x;");
  });

  test("returns the first value of a repeated cookie", () => {
    expect(getCookie("a=1; a=2", "a")).toBe("1");
  });
});

describe("clearSessionCookie", () => {
  test("expires the session cookie for the configured domain", () => {
    const res = createResponse();

    clearSessionCookie(res);

    expect(res.getHeader("Set-Cookie")).toBe(
      `${SESSION_COOKIE_NAME}=; Max-Age=0; Domain=test.example.com; Path=/; HttpOnly; Secure; SameSite=Lax`,
    );
  });
});
