import { describe, expect, test } from "vitest";
import { createErrorPageLoader } from "../errorPages";
import { InternalServerError, NotFoundError } from "@/router/errors";
import { PRIVATE_CACHE_CONTROL_VALUE } from "@/constants/cdn";
import type { HttpError } from "@/router/errors";

async function load(status: 403 | 404 | 500, error?: HttpError) {
  const result = await createErrorPageLoader(status)({
    url: new URL("http://localhost/missing"),
    headers: new Headers(),
    parameters: {},
    error,
  });
  if (result instanceof Response) {
    throw new Error("Expected loader data");
  }
  return result;
}

describe("createErrorPageLoader", () => {
  test("titles the page after the error", async () => {
    const result = await load(404);
    expect(result.title).toBe("Page not found - Tiles");
  });

  test("prevents caching", async () => {
    const result = await load(404);
    expect(result.headers).toEqual({ "Cache-Control": PRIVATE_CACHE_CONTROL_VALUE });
  });

  test("passes the status to the page", async () => {
    const result = await load(403);
    expect(result.data).toEqual({ status: 403, details: undefined });
  });

  test("includes the cause of a server error in development", async () => {
    const cause = new TypeError("Boom");
    const result = await load(500, new InternalServerError({ cause }));
    expect(result.data.details).toContain("TypeError: Boom");
  });

  test("describes a server error without a cause", async () => {
    const result = await load(500, new InternalServerError());
    expect(result.data.details).toContain("InternalServerError: Internal Server Error");
  });

  test("includes no details for other errors", async () => {
    const result = await load(404, new NotFoundError());
    expect(result.data.details).toBeUndefined();
  });
});
