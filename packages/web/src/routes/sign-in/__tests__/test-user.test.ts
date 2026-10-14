import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { SESSION_COOKIE_NAME } from "api/constants/cookies";
import route from "../test-user";
import { signIn } from "@/auth/sessions";
import { requestProperties } from "@/test/routes";

vi.mock("@/auth/sessions", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/auth/sessions")>()),
  signIn: vi.fn(),
}));

describe("sign-in/test-user", () => {
  beforeEach(() => {
    vi.mocked(signIn).mockResolvedValue({
      id: "session-id",
      expiresAt: "2030-01-01T00:00:00.000Z",
    });
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  test("signs in the test user and redirects to the index in development", async () => {
    const response = await route.get(
      requestProperties({ url: "http://localhost/sign-in/test-user" }),
    );

    expect(signIn).toHaveBeenCalledExactlyOnceWith({
      provider: "GOOGLE",
      providerId: "test-user",
      name: "Test User",
      email: "test@test.com",
      emailVerified: true,
    });
    expect(response.status).toBe(302);
    expect(response.headers.get("Location")).toBe("/");
    expect(response.headers.getSetCookie()).toContainEqual(
      expect.stringContaining(`${SESSION_COOKIE_NAME}=session-id;`),
    );
  });

  test("is not found outside development", async () => {
    vi.stubEnv("DEV", false);

    const response = await route.get(
      requestProperties({ url: "http://localhost/sign-in/test-user" }),
    );

    expect(response.status).toBe(404);
    expect(signIn).not.toHaveBeenCalled();
  });
});
