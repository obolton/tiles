import { describe, test, expect, vi, beforeEach } from "vitest";
import { getSessionContext } from "@/routes/users/users";
import { SESSION_COOKIE_NAME } from "@/constants/cookies";
import { SERVICE_TOKEN_HEADER } from "@/constants/headers";
import { createContext } from "@/utils/trpc";
import { createRequest, createResponse } from "@/test/mocks/http";
import type { IncomingMessage } from "node:http";

vi.mock("@/routes/users/users", () => ({
  getSessionContext: vi.fn(),
}));

function createContextOptions(headers: IncomingMessage["headers"] = {}) {
  return { req: createRequest(headers), res: createResponse() };
}

beforeEach(() => {
  vi.mocked(getSessionContext).mockImplementation(async (sessionId) =>
    sessionId.startsWith("valid-") ? { userId: "user-1" } : null,
  );
});

describe("createContext", () => {
  test("returns an unauthenticated context without credentials", async () => {
    const opts = createContextOptions();

    await expect(createContext(opts)).resolves.toEqual({
      res: opts.res,
      sessionId: null,
      userId: null,
      isService: false,
    });
    expect(getSessionContext).not.toHaveBeenCalled();
    expect(opts.res.getHeader("Set-Cookie")).toBeUndefined();
  });

  test("authenticates with a bearer token", async () => {
    const opts = createContextOptions({ authorization: "Bearer valid-header" });

    await expect(createContext(opts)).resolves.toEqual({
      res: opts.res,
      sessionId: "valid-header",
      userId: "user-1",
      isService: false,
    });
    expect(getSessionContext).toHaveBeenCalledExactlyOnceWith("valid-header");
  });

  test("prefers the Authorization header over the session cookie", async () => {
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
  ])("rejects an Authorization header with %s", async (_, authorization) => {
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

  test("authenticates with the session cookie", async () => {
    const opts = createContextOptions({
      cookie: `other=value; ${SESSION_COOKIE_NAME}=valid-cookie`,
    });

    await expect(createContext(opts)).resolves.toEqual({
      res: opts.res,
      sessionId: "valid-cookie",
      userId: "user-1",
      isService: false,
    });
    expect(getSessionContext).toHaveBeenCalledExactlyOnceWith("valid-cookie");
  });

  test("ignores cookies other than the session cookie", async () => {
    const opts = createContextOptions({ cookie: "session=valid-cookie" });

    await expect(createContext(opts)).resolves.toMatchObject({ sessionId: null, userId: null });
    expect(getSessionContext).not.toHaveBeenCalled();
  });

  test("ignores an empty session cookie", async () => {
    const opts = createContextOptions({ cookie: `${SESSION_COOKIE_NAME}=` });

    await expect(createContext(opts)).resolves.toMatchObject({ sessionId: null, userId: null });
    expect(getSessionContext).not.toHaveBeenCalled();
  });

  test("clears the session cookie for an unknown or expired session", async () => {
    const opts = createContextOptions({ cookie: `${SESSION_COOKIE_NAME}=expired-cookie` });

    await expect(createContext(opts)).resolves.toEqual({
      res: opts.res,
      sessionId: null,
      userId: null,
      isService: false,
    });
    expect(getSessionContext).toHaveBeenCalledExactlyOnceWith("expired-cookie");
    expect(opts.res.getHeader("Set-Cookie")).toMatch(
      new RegExp(`^${SESSION_COOKIE_NAME}=;.*Max-Age=0`),
    );
  });

  test("does not authenticate with an unknown bearer token", async () => {
    const opts = createContextOptions({ authorization: "Bearer expired-header" });

    await expect(createContext(opts)).resolves.toMatchObject({ sessionId: null, userId: null });
  });
});

describe("createContext with a service token", () => {
  const SERVICE_TOKEN_KEY = SERVICE_TOKEN_HEADER.toLowerCase();

  test("authenticates a service with a valid token", async () => {
    const opts = createContextOptions({ [SERVICE_TOKEN_KEY]: "test" });

    await expect(createContext(opts)).resolves.toEqual({
      res: opts.res,
      sessionId: null,
      userId: null,
      isService: true,
    });
    expect(getSessionContext).not.toHaveBeenCalled();
  });

  test("ignores session credentials on a service request", async () => {
    const opts = createContextOptions({
      [SERVICE_TOKEN_KEY]: "test",
      authorization: "Bearer valid-header",
      cookie: `${SESSION_COOKIE_NAME}=valid-cookie`,
    });

    await expect(createContext(opts)).resolves.toMatchObject({
      sessionId: null,
      userId: null,
      isService: true,
    });
    expect(getSessionContext).not.toHaveBeenCalled();
  });

  test.each([
    ["an invalid token", "wrong"],
    ["a token with a different length", "test-longer"],
    ["an empty token", ""],
  ])("rejects %s", async (_, token) => {
    const opts = createContextOptions({
      [SERVICE_TOKEN_KEY]: token,
      cookie: `${SESSION_COOKIE_NAME}=valid-cookie`,
    });

    await expect(createContext(opts)).rejects.toMatchObject({
      code: "UNAUTHORIZED",
      message: "Invalid service token",
    });
    expect(getSessionContext).not.toHaveBeenCalled();
  });
});

describe("SERVICE_API_TOKEN", () => {
  test("is required when the module loads", async () => {
    vi.resetModules();
    vi.stubEnv("SERVICE_API_TOKEN", "");

    await expect(import("@/utils/trpc")).rejects.toThrow("SERVICE_API_TOKEN is not defined");

    vi.unstubAllEnvs();
  });
});
