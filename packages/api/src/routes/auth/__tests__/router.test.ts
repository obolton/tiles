import { describe, test, expect, vi, beforeEach } from "vitest";
import { SESSION_COOKIE_NAME } from "@/constants/cookies";
import { signIn, signOut } from "../auth";
import router from "../router";
import {
  createAuthenticatedContext,
  createServiceContext,
  createUnauthenticatedContext,
} from "@/test/mocks/context";

vi.mock("../auth", () => ({
  signIn: vi.fn(),
  signOut: vi.fn(),
}));

const SIGN_IN_INPUT = {
  provider: "GOOGLE" as const,
  providerId: "google-123",
  name: "Test User",
  email: "test@example.com",
  emailVerified: true,
};

const SESSION = {
  id: "session-1",
  userId: "user-1",
  createdAt: new Date("2025-01-01"),
  expiresAt: new Date("2025-02-01"),
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(signIn).mockResolvedValue(SESSION);
});

describe("signIn", () => {
  test("should reject an unauthenticated caller", async () => {
    const caller = router.createCaller(createUnauthenticatedContext());

    await expect(caller.signIn(SIGN_IN_INPUT)).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    expect(signIn).not.toHaveBeenCalled();
  });

  test("should reject a signed-in user", async () => {
    const caller = router.createCaller(createAuthenticatedContext());

    await expect(caller.signIn(SIGN_IN_INPUT)).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    expect(signIn).not.toHaveBeenCalled();
  });

  test("should create a session for a service caller", async () => {
    const caller = router.createCaller(createServiceContext("web"));

    await expect(caller.signIn(SIGN_IN_INPUT)).resolves.toEqual(SESSION);
    expect(signIn).toHaveBeenCalledExactlyOnceWith(SIGN_IN_INPUT);
  });

  test("should validate the input for a service caller", async () => {
    const caller = router.createCaller(createServiceContext("web"));

    await expect(caller.signIn({ ...SIGN_IN_INPUT, email: "not-an-email" })).rejects.toMatchObject({
      code: "BAD_REQUEST",
    });
    expect(signIn).not.toHaveBeenCalled();
  });
});

describe("signOut", () => {
  test("should delete the session and clear the cookie for a signed-in user", async () => {
    const ctx = createAuthenticatedContext({ sessionId: "session-1" });
    const caller = router.createCaller(ctx);

    await expect(caller.signOut()).resolves.toBeNull();
    expect(signOut).toHaveBeenCalledExactlyOnceWith("session-1");
    expect(ctx.res.getHeader("Set-Cookie")).toMatch(
      new RegExp(`^${SESSION_COOKIE_NAME}=;.*Max-Age=0`),
    );
  });

  test("should do nothing for an unauthenticated caller", async () => {
    const ctx = createUnauthenticatedContext();
    const caller = router.createCaller(ctx);

    await expect(caller.signOut()).resolves.toBeNull();
    expect(signOut).not.toHaveBeenCalled();
    expect(ctx.res.getHeader("Set-Cookie")).toBeUndefined();
  });
});
