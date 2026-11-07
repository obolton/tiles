import { describe, expect, test } from "vitest";
import { createErrorPageLoader } from "../errorPages";
import { NotFoundError } from "@/router/errors";
import { PRIVATE_CACHE_CONTROL_VALUE } from "@/constants/cdn";
import type { HttpError } from "@/router/errors";

function load(error?: HttpError) {
  return createErrorPageLoader("Page not found")({
    url: new URL("http://localhost/missing"),
    headers: new Headers(),
    parameters: {},
    error,
  });
}

describe("createErrorPageLoader", () => {
  test("passes the error to the page with the title and no caching", async () => {
    const error = new NotFoundError();
    await expect(load(error)).resolves.toEqual({
      title: "Page not found - Tiles",
      headers: { "Cache-Control": PRIVATE_CACHE_CONTROL_VALUE },
      data: { error },
    });
  });

  test("requires an error", async () => {
    await expect(load()).rejects.toThrow("Error routes can only be rendered for an error");
  });
});
