import { describe, expect, test } from "vitest";
import { createPreflightResponse, createJsonResponse } from "../responses";

describe("createPreflightResponse", () => {
  test("returns 204 status", () => {
    const response = createPreflightResponse();

    expect(response.status).toBe(204);
  });

  test("sets CORS headers", () => {
    const response = createPreflightResponse();

    expect(response.headers.get("Access-Control-Allow-Origin")).toBe("https://example.com");
    expect(response.headers.get("Access-Control-Allow-Credentials")).toBe("true");
    expect(response.headers.get("Access-Control-Allow-Methods")).toBe("PUT");
    expect(response.headers.get("Access-Control-Allow-Headers")).toBe("Content-Type");
    expect(response.headers.get("Access-Control-Max-Age")).toBe("3600");
  });

  test("has no body", async () => {
    const response = createPreflightResponse();

    expect(response.body).toBeNull();
  });
});

describe("createJsonResponse", () => {
  test("returns 200 status by default", () => {
    const response = createJsonResponse({ foo: "bar" });

    expect(response.status).toBe(200);
  });

  test("accepts custom status code", () => {
    const response = createJsonResponse({ error: "Not found" }, 404);

    expect(response.status).toBe(404);
  });

  test("sets Content-Type header", () => {
    const response = createJsonResponse({ foo: "bar" });

    expect(response.headers.get("Content-Type")).toBe("application/json");
  });

  test("sets CORS headers", () => {
    const response = createJsonResponse({ foo: "bar" });

    expect(response.headers.get("Access-Control-Allow-Origin")).toBe("https://example.com");
    expect(response.headers.get("Access-Control-Allow-Credentials")).toBe("true");
  });

  test("serializes data as JSON", async () => {
    const data = { foo: "bar", count: 42 };
    const response = createJsonResponse(data);

    const body = await response.json();

    expect(body).toEqual(data);
  });
});
