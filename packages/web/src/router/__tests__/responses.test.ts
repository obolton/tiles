import { describe, expect, test } from "vitest";
import { redirect, forbidden, notFound, internalError } from "../responses";

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

describe("forbidden", () => {
  test("returns 403 status", () => {
    const response = forbidden();
    expect(response.status).toBe(403);
  });

  test("has Forbidden status text", () => {
    const response = forbidden();
    expect(response.statusText).toBe("Forbidden");
  });

  test("has null body", async () => {
    const response = forbidden();
    expect(response.body).toBeNull();
  });

  test("includes custom headers", () => {
    const response = forbidden({ "Set-Cookie": "session=; Max-Age=0" });
    expect(response.headers.get("Set-Cookie")).toBe("session=; Max-Age=0");
  });
});

describe("notFound", () => {
  test("returns 404 status", () => {
    const response = notFound();
    expect(response.status).toBe(404);
  });

  test("has Not Found status text", () => {
    const response = notFound();
    expect(response.statusText).toBe("Not Found");
  });

  test("includes Not Found in body", async () => {
    const response = notFound();
    const body = await response.text();
    expect(body).toBe("Not Found");
  });

  test("includes custom headers", () => {
    const response = notFound({ "Cache-Control": "no-store" });
    expect(response.headers.get("Cache-Control")).toBe("no-store");
  });
});

describe("internalError", () => {
  test("returns 500 status", () => {
    const response = internalError();
    expect(response.status).toBe(500);
  });

  test("has expected status text", () => {
    const response = internalError();
    expect(response.statusText).toBe("Internal Server Error");
  });

  test("sets body", async () => {
    const response = internalError("TEST");
    const body = await response.text();
    expect(body).toBe("TEST");
  });

  test("includes custom headers", () => {
    const response = internalError("TEST", { "X-Request-Id": "req-123" });
    expect(response.headers.get("X-Request-Id")).toBe("req-123");
  });
});
