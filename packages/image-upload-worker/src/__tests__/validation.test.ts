import { describe, expect, test } from "vitest";
import { validateContentLength, MAX_CONTENT_LENGTH } from "../validation";
import { BadRequestError, LengthRequiredError, ContentTooLargeError } from "../errors";

describe("validateContentLength", () => {
  test("throws LengthRequiredError when header is null", () => {
    expect(() => validateContentLength(null)).toThrow(LengthRequiredError);
  });

  test("throws LengthRequiredError when header is empty string", () => {
    expect(() => validateContentLength("")).toThrow(LengthRequiredError);
  });

  test("throws BadRequestError when content length is zero", () => {
    expect(() => validateContentLength("0")).toThrow(BadRequestError);
  });

  test("throws BadRequestError when content length is negative", () => {
    expect(() => validateContentLength("-1")).toThrow(BadRequestError);
  });

  test("throws BadRequestError when header is not a valid number", () => {
    expect(() => validateContentLength("invalid")).toThrow(BadRequestError);
  });

  test("throws ContentTooLargeError when content length exceeds maximum", () => {
    const tooLarge = (MAX_CONTENT_LENGTH + 1).toString();

    expect(() => validateContentLength(tooLarge)).toThrow(ContentTooLargeError);
  });

  test("does not throw for valid content length", () => {
    expect(() => validateContentLength("1024")).not.toThrow();
  });

  test("does not throw for content length at maximum", () => {
    const atMax = MAX_CONTENT_LENGTH.toString();

    expect(() => validateContentLength(atMax)).not.toThrow();
  });
});

describe("MAX_CONTENT_LENGTH", () => {
  test("is 25 MB", () => {
    expect(MAX_CONTENT_LENGTH).toBe(25 * 1024 * 1024);
  });
});
