import { describe, test, expect, vi } from "vitest";
import { SESSION_COOKIE_NAME } from "@/constants/cookies";
import { signIn, signOut } from "../auth";
import { createCaller } from "@/test/caller";
import { createAuthenticatedContext, createUnauthenticatedContext } from "@/test/mocks/context";
import { describeRouter } from "@/test/router";
import type { SignInSchema } from "../schema";

vi.mock("../auth");

const SIGN_IN_INPUT: SignInSchema = {
  provider: "GOOGLE",
  providerId: "google-123",
  name: "Test User",
  email: "test@example.com",
  emailVerified: true,
};

describeRouter("auth", {
  signIn: {
    guard: "service",
    handler: signIn,
    input: SIGN_IN_INPUT,
    args: (input) => [input],
    invalid: { ...SIGN_IN_INPUT, email: "not-an-email" },
  },
  signOut: {
    guard: "public",
    input: undefined,
  },
});

describe("auth.signOut", () => {
  test("deletes the session and clears the cookie for a signed-in user", async () => {
    const ctx = createAuthenticatedContext({ sessionId: "session-1" });
    const caller = createCaller(ctx);

    await expect(caller.auth.signOut()).resolves.toBeNull();
    expect(signOut).toHaveBeenCalledExactlyOnceWith("session-1");
    expect(ctx.res.getHeader("Set-Cookie")).toMatch(
      new RegExp(`^${SESSION_COOKIE_NAME}=;.*Max-Age=0`),
    );
  });

  test("does nothing for an unauthenticated caller", async () => {
    const ctx = createUnauthenticatedContext();
    const caller = createCaller(ctx);

    await expect(caller.auth.signOut()).resolves.toBeNull();
    expect(signOut).not.toHaveBeenCalled();
    expect(ctx.res.getHeader("Set-Cookie")).toBeUndefined();
  });
});
