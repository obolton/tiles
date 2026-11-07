import { describe, expect, test } from "vitest";
import { SESSION_COOKIE_NAME } from "api/constants/cookies";
import { createErrorPageLoader } from "../errorPages";
import { InternalServerError, NotFoundError } from "@/router/errors";
import { PRIVATE_CACHE_CONTROL_VALUE } from "@/constants/cdn";
import type { HttpError } from "@/router/errors";

const PAGE_ID = "b8c96309-cc54-445b-a274-98b6be12c43f";

async function load(status: 403 | 404 | 500, url: string, cookie?: string, error?: HttpError) {
  const result = await createErrorPageLoader(status)({
    url: new URL(url),
    headers: new Headers(cookie ? { cookie } : {}),
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
    const result = await load(404, "http://localhost/missing");
    expect(result.title).toBe("Page not found - Tiles");
  });

  test("prevents caching", async () => {
    const result = await load(404, "http://localhost/missing");
    expect(result.headers).toEqual({ "Cache-Control": PRIVATE_CACHE_CONTROL_VALUE });
  });

  test("describes a signed-out visitor to an unknown path", async () => {
    const result = await load(
      404,
      "http://localhost/missing?query=1",
      undefined,
      new NotFoundError(),
    );
    expect(result.data).toEqual({
      status: 404,
      path: "/missing?query=1",
      destination: null,
      signedIn: false,
      details: undefined,
    });
  });

  test("offers a page as a sign-in destination", async () => {
    const result = await load(404, `http://localhost/pages/${PAGE_ID}`);
    expect(result.data.destination).toBe(`pages/${PAGE_ID}`);
  });

  test("recognizes a signed-in visitor", async () => {
    const result = await load(403, "http://localhost/missing", `${SESSION_COOKIE_NAME}=session-id`);
    expect(result.data.signedIn).toBe(true);
  });

  test("includes the cause of a server error in development", async () => {
    const cause = new TypeError("Boom");
    const result = await load(
      500,
      "http://localhost/broken",
      undefined,
      new InternalServerError({ cause }),
    );
    expect(result.data.details).toContain("TypeError: Boom");
  });

  test("describes a server error without a cause", async () => {
    const result = await load(500, "http://localhost/broken", undefined, new InternalServerError());
    expect(result.data.details).toContain("InternalServerError: Internal Server Error");
  });

  test("includes no details for other errors", async () => {
    const result = await load(404, "http://localhost/missing", undefined, new NotFoundError());
    expect(result.data.details).toBeUndefined();
  });
});
