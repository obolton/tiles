import { describe, expect, test } from "vitest";
import {
  HttpError,
  BadRequestError,
  UnauthorizedError,
  MethodNotAllowedError,
  LengthRequiredError,
  ContentTooLargeError,
  UnsupportedMediaTypeError,
  InternalServerError,
} from "../errors";

describe("HttpError", () => {
  test("creates error with status and message", () => {
    const error = new HttpError(418, "I'm a teapot");

    expect(error).toBeInstanceOf(Error);
    expect(error.status).toBe(418);
    expect(error.message).toBe("I'm a teapot");
  });
});

describe("BadRequestError", () => {
  test("has status 400 with default message", () => {
    const error = new BadRequestError();

    expect(error).toBeInstanceOf(HttpError);
    expect(error.status).toBe(400);
    expect(error.message).toBe("Bad Request");
  });

  test("accepts custom message", () => {
    const error = new BadRequestError("Invalid input");

    expect(error.status).toBe(400);
    expect(error.message).toBe("Invalid input");
  });
});

describe("UnauthorizedError", () => {
  test("has status 401 with default message", () => {
    const error = new UnauthorizedError();

    expect(error).toBeInstanceOf(HttpError);
    expect(error.status).toBe(401);
    expect(error.message).toBe("Unauthorized");
  });

  test("accepts custom message", () => {
    const error = new UnauthorizedError("Invalid token");

    expect(error.status).toBe(401);
    expect(error.message).toBe("Invalid token");
  });
});

describe("MethodNotAllowedError", () => {
  test("has status 405", () => {
    const error = new MethodNotAllowedError();

    expect(error).toBeInstanceOf(HttpError);
    expect(error.status).toBe(405);
    expect(error.message).toBe("Method Not Allowed");
  });
});

describe("LengthRequiredError", () => {
  test("has status 411", () => {
    const error = new LengthRequiredError();

    expect(error).toBeInstanceOf(HttpError);
    expect(error.status).toBe(411);
    expect(error.message).toBe("Length Required");
  });
});

describe("ContentTooLargeError", () => {
  test("has status 413", () => {
    const error = new ContentTooLargeError();

    expect(error).toBeInstanceOf(HttpError);
    expect(error.status).toBe(413);
    expect(error.message).toBe("Content Too Large");
  });
});

describe("UnsupportedMediaTypeError", () => {
  test("has status 415", () => {
    const error = new UnsupportedMediaTypeError();

    expect(error).toBeInstanceOf(HttpError);
    expect(error.status).toBe(415);
    expect(error.message).toBe("Unsupported Media Type");
  });
});

describe("InternalServerError", () => {
  test("has status 500 with default message", () => {
    const error = new InternalServerError();

    expect(error).toBeInstanceOf(HttpError);
    expect(error.status).toBe(500);
    expect(error.message).toBe("Internal Server Error");
  });

  test("accepts custom message", () => {
    const error = new InternalServerError("Database connection failed");

    expect(error.status).toBe(500);
    expect(error.message).toBe("Database connection failed");
  });
});
