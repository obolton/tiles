import { describe, expect, test } from "vitest";
import { loader as notFoundLoader } from "../404";
import { loader as forbiddenLoader } from "../403";
import { loader as serverErrorLoader } from "../500";
import { InternalServerError } from "@/router/errors";
import { PRIVATE_CACHE_CONTROL_VALUE } from "@/constants/cdn";
import type { HttpError } from "@/router/errors";

function request(error: HttpError) {
  return {
    url: new URL("http://localhost/missing"),
    headers: new Headers(),
    parameters: {},
    error,
  };
}

describe("error route loaders", () => {
  test("title the 404 page and prevent caching", async () => {
    await expect(notFoundLoader()).resolves.toEqual({
      title: "Page not found - Tiles",
      headers: { "Cache-Control": PRIVATE_CACHE_CONTROL_VALUE },
      data: undefined,
    });
  });

  test("title the 403 page and prevent caching", async () => {
    await expect(forbiddenLoader()).resolves.toEqual({
      title: "Access denied - Tiles",
      headers: { "Cache-Control": PRIVATE_CACHE_CONTROL_VALUE },
      data: undefined,
    });
  });

  test("pass the error to the 500 page", async () => {
    const error = new InternalServerError({ cause: new TypeError("Boom") });
    await expect(serverErrorLoader(request(error))).resolves.toEqual({
      title: "Something went wrong - Tiles",
      headers: { "Cache-Control": PRIVATE_CACHE_CONTROL_VALUE },
      data: { error },
    });
  });

});
    await expect(forbiddenLoader()).resolves.toMatchObject({ data: undefined });
    expect(new NotFoundError().status).toBe(404);
    expect(new ForbiddenError().status).toBe(403);
  });
});
