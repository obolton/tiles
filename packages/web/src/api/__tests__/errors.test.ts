import { describe, expect, test } from "vitest";
import { TRPCClientError } from "@trpc/client";
import { isAPIErrorCode } from "../errors";
import type { AppRouter } from "api/routes/index";

function apiError(code: "BAD_REQUEST" | "NOT_FOUND", httpStatus: number) {
  return new TRPCClientError<AppRouter>("Rejected", {
    result: { error: { message: "Rejected", code: -32600, data: { code, httpStatus } } },
  });
}

describe("isAPIErrorCode", () => {
  test("matches an API error with the code", () => {
    expect(isAPIErrorCode(apiError("BAD_REQUEST", 400), "BAD_REQUEST")).toBe(true);
  });

  test("does not match an API error with another code", () => {
    expect(isAPIErrorCode(apiError("NOT_FOUND", 404), "BAD_REQUEST")).toBe(false);
  });

  test("does not match an API error without data", () => {
    expect(isAPIErrorCode(new TRPCClientError("Network failure"), "BAD_REQUEST")).toBe(false);
  });

  test("does not match other errors", () => {
    expect(isAPIErrorCode(new Error("BAD_REQUEST"), "BAD_REQUEST")).toBe(false);
    expect(isAPIErrorCode(undefined, "BAD_REQUEST")).toBe(false);
  });
});
