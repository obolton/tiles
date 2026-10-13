import { describe, it, expect, vi, beforeEach } from "vitest";
import { getSessionContext } from "@/routes/users/users.ts";
import { SESSION_COOKIE_NAME } from "@/constants/cookies.ts";
import { createContext } from "@/utils/trpc.ts";
import { createHTTPContextOptions } from "@/test/trpc.ts";

vi.mock("@/routes/users/users.ts", () => ({
  getSessionContext: vi.fn(),
}));

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(getSessionContext).mockImplementation(async (sessionId) =>
    sessionId.startsWith("valid-") ? { userId: "user-1" } : null,
  );
});

describe("createContext", () => {
  it("should return an unauthenticated context without credentials", async () => {
    const opts = createHTTPContextOptions();

    await expect(createContext(opts)).resolves.toEqual({
      res: opts.res,
      sessionId: null,
      userId: null,
      serviceName: null,
    });
    expect(getSessionContext).not.toHaveBeenCalled();
    expect(opts.res.getHeader("Set-Cookie")).toBeUndefined();
  });

  it("should authenticate with a bearer token", async () => {
    const opts = createHTTPContextOptions({ authorization: "Bearer valid-header" });

    await expect(createContext(opts)).resolves.toEqual({
      res: opts.res,
      sessionId: "valid-header",
      userId: "user-1",
      serviceName: null,
    });
    expect(getSessionContext).toHaveBeenCalledExactlyOnceWith("valid-header");
  });

  it("should prefer the Authorization header over the session cookie", async () => {
    const opts = createHTTPContextOptions({
      authorization: "Bearer valid-header",
      cookie: `${SESSION_COOKIE_NAME}=valid-cookie`,
    });

    await expect(createContext(opts)).resolves.toMatchObject({ sessionId: "valid-header" });
    expect(getSessionContext).toHaveBeenCalledExactlyOnceWith("valid-header");
  });

  it.each([
    ["a non-Bearer scheme", "Basic valid-header"],
    ["a missing token", "Bearer"],
    ["an empty token", "Bearer "],
  ])("should reject an Authorization header with %s", async (_, authorization) => {
    const opts = createHTTPContextOptions({
      authorization,
      cookie: `${SESSION_COOKIE_NAME}=valid-cookie`,
    });

    await expect(createContext(opts)).rejects.toMatchObject({
      code: "UNAUTHORIZED",
      message: "Invalid Authorization header",
    });
    expect(getSessionContext).not.toHaveBeenCalled();
  });

  it("should authenticate with the session cookie", async () => {
    const opts = createHTTPContextOptions({
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

  it("should ignore cookies other than the session cookie", async () => {
    const opts = createHTTPContextOptions({ cookie: "session=valid-cookie" });

    await expect(createContext(opts)).resolves.toMatchObject({ sessionId: null, userId: null });
    expect(getSessionContext).not.toHaveBeenCalled();
  });

  it("should ignore an empty session cookie", async () => {
    const opts = createHTTPContextOptions({ cookie: `${SESSION_COOKIE_NAME}=` });

    await expect(createContext(opts)).resolves.toMatchObject({ sessionId: null, userId: null });
    expect(getSessionContext).not.toHaveBeenCalled();
  });

  it("should clear the session cookie for an unknown or expired session", async () => {
    const opts = createHTTPContextOptions({ cookie: `${SESSION_COOKIE_NAME}=expired-cookie` });

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

  it("should not authenticate with an unknown bearer token", async () => {
    const opts = createHTTPContextOptions({ authorization: "Bearer expired-header" });

    await expect(createContext(opts)).resolves.toMatchObject({ sessionId: null, userId: null });
  });
});

describe("SERVICE_API_TOKEN", () => {
  it("should be required when the module loads", async () => {
    vi.resetModules();
    vi.stubEnv("SERVICE_API_TOKEN", "");

    await expect(import("@/utils/trpc.ts")).rejects.toThrow("SERVICE_API_TOKEN is not defined");

    vi.unstubAllEnvs();
  });
});
