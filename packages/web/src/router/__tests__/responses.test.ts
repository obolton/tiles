import { describe, expect, test } from "vitest";
import { redirect } from "../responses";

describe("redirect", () => {
  test("returns 301 status by default", () => {
    const response = redirect("/path");
    expect(response.status).toBe(301);
  });

  test("sets Location header", () => {
    const response = redirect("/path");
    expect(response.headers.get("Location")).toBe("/path");
  });

  test("accepts custom status code", () => {
    const response = redirect("/path", 302);
    expect(response.status).toBe(302);
  });

  test("accepts 307 status code", () => {
    const response = redirect("/path", 307);
    expect(response.status).toBe(307);
  });

  test("accepts 308 status code", () => {
    const response = redirect("/path", 308);
    expect(response.status).toBe(308);
  });

  test("includes additional headers", () => {
    const response = redirect("/path", 302, { "Set-Cookie": "session=abc" });
    expect(response.headers.get("Location")).toBe("/path");
    expect(response.headers.get("Set-Cookie")).toBe("session=abc");
  });

  test("has null body", async () => {
    const response = redirect("/path");
    expect(response.body).toBeNull();
  });
});
