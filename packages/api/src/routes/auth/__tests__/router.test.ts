import { describe, test, expect, vi, beforeEach } from "vitest";
import { signIn, signOut } from "@/routes/auth/auth";
import { clearSessionCookie } from "@/utils/cookies";
import { createCaller } from "@/test/caller";
import { createAuthenticatedContext, createUnauthenticatedContext } from "@/test/mocks/context";
import { describeRouter } from "@/test/procedures";
import type { SignInSchema } from "@/routes/auth/schema";

vi.mock("@/routes/auth/auth");
vi.mock("@/utils/cookies");

const SIGN_IN: SignInSchema = {
  provider: "GOOGLE",
  providerId: "google-1",
  name: "Alice",
  email: "alice@example.com",
  emailVerified: true,
};

describeRouter("auth", {
  signIn: {
    guard: "public",
    handler: signIn,
    input: SIGN_IN,
    args: (input) => [input],
    invalid: { ...SIGN_IN, email: "not-an-email" },
  },
  signOut: {
    guard: "public",
    input: undefined,
  },
});

describe("auth.signOut", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("does nothing without a session", async () => {
    await expect(createCaller(createUnauthenticatedContext()).auth.signOut()).resolves.toBeNull();
    expect(signOut).not.toHaveBeenCalled();
    expect(clearSessionCookie).not.toHaveBeenCalled();
  });

  test("clears the cookie and deletes the caller's session", async () => {
    const ctx = createAuthenticatedContext({ sessionId: "session-2" });
    await expect(createCaller(ctx).auth.signOut()).resolves.toBeNull();
    expect(clearSessionCookie).toHaveBeenCalledExactlyOnceWith(ctx.res);
    expect(signOut).toHaveBeenCalledExactlyOnceWith("session-2");
  });
});
