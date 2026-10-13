import { describe, test, expect, vi, beforeEach } from "vitest";
import { getSessionContext } from "@/routes/users/users.ts";
import { SESSION_COOKIE_NAME } from "@/constants/cookies.ts";
import { createContext } from "@/utils/trpc.ts";
import { createRequest, createResponse } from "@/test/mocks/http.ts";
import type { IncomingMessage } from "node:http";

vi.mock("@/routes/users/users.ts", () => ({
  getSessionContext: vi.fn(),
}));

function createContextOptions(headers: IncomingMessage["headers"] = {}) {
  return { req: createRequest(headers), res: createResponse() };
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(getSessionContext).mockImplementation(async (sessionId) =>
    sessionId.startsWith("valid-") ? { userId: "user-1" } : null,
  );
});

describe("createContext", () => {
  test("should return an unauthenticated context without credentials", async () => {
    const opts = createContextOptions();

    await expect(createContext(opts)).resolves.toEqual({
      res: opts.res,
      sessionId: null,
      userId: null,
      serviceName: null,
    });
    expect(getSessionContext).not.toHaveBeenCalled();
    expect(opts.res.getHeader("Set-Cookie")).toBeUndefined();
  });

  test("should authenticate with a bearer token", async () => {
    const opts = createContextOptions({ authorization: "Bearer valid-header" });

    await expect(createContext(opts)).resolves.toEqual({
      res: opts.res,
      sessionId: "valid-header",
      userId: "user-1",
      serviceName: null,
    });
    expect(getSessionContext).toHaveBeenCalledExactlyOnceWith("valid-header");
  });

  test("should prefer the Authorization header over the session cookie", async () => {
    const opts = createContextOptions({
      authorization: "Bearer valid-header",
      cookie: `${SESSION_COOKIE_NAME}=valid-cookie`,
    });

    await expect(createContext(opts)).resolves.toMatchObject({ sessionId: "valid-header" });
    expect(getSessionContext).toHaveBeenCalledExactlyOnceWith("valid-header");
  });

  test.each([
    ["a non-Bearer scheme", "Basic valid-header"],
    ["a missing token", "Bearer"],
    ["an empty token", "Bearer "],
  ])("should reject an Authorization header with %s", async (_, authorization) => {
    const opts = createContextOptions({
      authorization,
      cookie: `${SESSION_COOKIE_NAME}=valid-cookie`,
    });

    await expect(createContext(opts)).rejects.toMatchObject({
      code: "UNAUTHORIZED",
      message: "Invalid Authorization header",
    });
    expect(getSessionContext).not.toHaveBeenCalled();
  });

  test("should authenticate with the session cookie", async () => {
    const opts = createContextOptions({
      cookie: `other=value; ${SESSION_COOKIE_NAME}=valid-cookie`,
    });

    await expect(createContext(opts)).resolves.toEqual({
      res: opts.res,
      sessionId: "valid-cookie",
      userId: "user-1",
      serviceName: null,
    });
    expect(getSessionContext).toHaveBeenCalledExactlyOnceWith("valid-cookie");
  });

  test("should ignore cookies other than the session cookie", async () => {
    const opts = createContextOptions({ cookie: "session=valid-cookie" });

    await expect(createContext(opts)).resolves.toMatchObject({ sessionId: null, userId: null });
    expect(getSessionContext).not.toHaveBeenCalled();
  });

  test("should ignore an empty session cookie", async () => {
    const opts = createContextOptions({ cookie: `${SESSION_COOKIE_NAME}=` });

    await expect(createContext(opts)).resolves.toMatchObject({ sessionId: null, userId: null });
    expect(getSessionContext).not.toHaveBeenCalled();
  });

  test("should clear the session cookie for an unknown or expired session", async () => {
    const opts = createContextOptions({ cookie: `${SESSION_COOKIE_NAME}=expired-cookie` });

    await expect(createContext(opts)).resolves.toEqual({
      res: opts.res,
      sessionId: null,
      userId: null,
      serviceName: null,
    });
    expect(getSessionContext).toHaveBeenCalledExactlyOnceWith("expired-cookie");
    expect(opts.res.getHeader("Set-Cookie")).toMatch(
      new RegExp(`^${SESSION_COOKIE_NAME}=;.*Max-Age=0`),
    );
  });

  test("should not authenticate with an unknown bearer token", async () => {
    const opts = createContextOptions({ authorization: "Bearer expired-header" });

    await expect(createContext(opts)).resolves.toMatchObject({ sessionId: null, userId: null });
  });
});

describe("SERVICE_API_TOKEN", () => {
  test("should be required when the module loads", async () => {
    vi.resetModules();
    vi.stubEnv("SERVICE_API_TOKEN", "");

    await expect(import("@/utils/trpc.ts")).rejects.toThrow("SERVICE_API_TOKEN is not defined");

    vi.unstubAllEnvs();
  });
});
