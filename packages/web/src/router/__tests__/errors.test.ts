import { describe, expect, test } from "vitest";
import { HttpError, ForbiddenError, NotFoundError, InternalServerError } from "../errors";

describe("HttpError", () => {
  test("stores the status and message", () => {
    const error = new HttpError(418, "I'm a teapot");
    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe("HttpError");
    expect(error.status).toBe(418);
    expect(error.message).toBe("I'm a teapot");
  });

  test("stores response headers", () => {
    const error = new HttpError(401, "Unauthorized", { headers: { "WWW-Authenticate": "Bearer" } });
    expect(error.headers.get("WWW-Authenticate")).toBe("Bearer");
  });

  test("has empty headers by default", () => {
    expect([...new HttpError(400, "Bad Request").headers]).toEqual([]);
  });

  test("keeps the cause", () => {
    const cause = new Error("Underlying");
    expect(new HttpError(500, "Failed", { cause }).cause).toBe(cause);
  });
});

describe("ForbiddenError", () => {
  test("is a 403 error", () => {
    const error = new ForbiddenError();
    expect(error).toBeInstanceOf(HttpError);
    expect(error.name).toBe("ForbiddenError");
    expect(error.status).toBe(403);
    expect(error.message).toBe("Forbidden");
  });

  test("accepts headers", () => {
    const error = new ForbiddenError({ headers: [["Set-Cookie", "session=; Max-Age=0"]] });
    expect(error.headers.get("Set-Cookie")).toBe("session=; Max-Age=0");
  });
});

describe("NotFoundError", () => {
  test("is a 404 error", () => {
    const error = new NotFoundError();
    expect(error).toBeInstanceOf(HttpError);
    expect(error.name).toBe("NotFoundError");
    expect(error.status).toBe(404);
    expect(error.message).toBe("Not Found");
  });
});

describe("InternalServerError", () => {
  test("is a 500 error", () => {
    const cause = new TypeError("Boom");
    const error = new InternalServerError({ cause });
    expect(error).toBeInstanceOf(HttpError);
    expect(error.name).toBe("InternalServerError");
    expect(error.status).toBe(500);
    expect(error.message).toBe("Internal Server Error");
    expect(error.cause).toBe(cause);
  });
});
