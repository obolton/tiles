import { beforeEach, describe, expect, test, vi } from "vitest";
import { SESSION_COOKIE_NAME, SIGNED_IN_FLAG_COOKIE_NAME } from "api/constants/cookies";
import route from "../callback";
import { exchangeCode, verifyIdToken } from "@/auth/google";
import { signIn } from "@/auth/sessions";
import { requestProperties } from "@/test/routes";

vi.mock("@/auth/google", () => ({ exchangeCode: vi.fn(), verifyIdToken: vi.fn() }));
vi.mock("@/auth/sessions", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/auth/sessions")>()),
  signIn: vi.fn(),
}));

const COOKIE_NAMES = {
  state: "__Host-oauth_state",
  verifier: "__Host-oauth_verifier",
  nonce: "__Host-oauth_nonce",
  destination: "__Host-oauth_dest",
};

const OAUTH_COOKIES = {
  state: "state-value",
  verifier: "verifier-value",
  nonce: "nonce-value",
  destination: "",
};

const GOOGLE_USER = {
  id: "google-id",
  name: "Test User",
  email: "test@example.com",
  emailVerified: true,
  imageUrl: "https://example.com/avatar.png",
};

const SESSION = { id: "session-id", expiresAt: "2030-01-01T00:00:00.000Z" };

type CookieValues = Partial<Record<keyof typeof OAUTH_COOKIES, string | null>>;

function cookieHeader(overrides: CookieValues = {}) {
  const values: Record<string, string | null> = { ...OAUTH_COOKIES, ...overrides };
  return Object.entries(COOKIE_NAMES)
    .filter(([key]) => values[key] !== null)
    .map(([key, name]) => `${name}=${encodeURIComponent(values[key] ?? "")}`)
    .join("; ");
}

function callback(search: string, cookie = cookieHeader()) {
  return route.get(
    requestProperties({ url: `http://localhost/sign-in/google/callback${search}`, cookie }),
  );
}

function expectClearedOAuthCookies(response: Response) {
  const cleared = response.headers
    .getSetCookie()
    .filter((cookie) => cookie.includes("Max-Age=0"))
    .map((cookie) => cookie.split("=")[0]);
  expect(cleared).toEqual(Object.values(COOKIE_NAMES));
}

describe("sign-in/google/callback", () => {
  beforeEach(() => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.mocked(exchangeCode).mockResolvedValue({ accessToken: "access-token", idToken: "id-token" });
    vi.mocked(verifyIdToken).mockResolvedValue(GOOGLE_USER);
    vi.mocked(signIn).mockResolvedValue(SESSION);
  });

  test("redirects to sign-in as cancelled when the user denied access", async () => {
    const response = await callback("?error=access_denied");

    expect(response.status).toBe(302);
    expect(response.headers.get("Location")).toBe("/sign-in?error=cancelled");
    expectClearedOAuthCookies(response);
    expect(exchangeCode).not.toHaveBeenCalled();
  });

  test("redirects to sign-in as failed for other OAuth errors", async () => {
    const response = await callback("?error=server_error");

    expect(response.status).toBe(302);
    expect(response.headers.get("Location")).toBe("/sign-in?error=failed");
    expectClearedOAuthCookies(response);
  });

  test.each([
    ["the state cookie is missing", "?state=state-value&code=auth-code", { state: null }],
    ["the verifier cookie is missing", "?state=state-value&code=auth-code", { verifier: null }],
    ["the nonce cookie is missing", "?state=state-value&code=auth-code", { nonce: null }],
    ["the state parameter is missing", "?code=auth-code", {}],
    ["the state does not match", "?state=other-state&code=auth-code", {}],
    ["the code is missing", "?state=state-value", {}],
  ] satisfies [string, string, CookieValues][])(
    "returns forbidden when %s",
    async (_, search, cookies) => {
      const response = await callback(search, cookieHeader(cookies));

      expect(response.status).toBe(403);
      expectClearedOAuthCookies(response);
      expect(exchangeCode).not.toHaveBeenCalled();
    },
  );

  test("returns forbidden for an invalid destination", async () => {
    const response = await callback(
      "?state=state-value&code=auth-code",
      cookieHeader({ destination: "https://evil.example/" }),
    );

    expect(response.status).toBe(403);
    expectClearedOAuthCookies(response);
    expect(exchangeCode).not.toHaveBeenCalled();
  });

  test("signs the user in and redirects to the destination", async () => {
    const response = await callback(
      "?state=state-value&code=auth-code",
      cookieHeader({ destination: "invites/accept/invite-key" }),
    );

    expect(exchangeCode).toHaveBeenCalledExactlyOnceWith({
      code: "auth-code",
      codeVerifier: "verifier-value",
    });
    expect(verifyIdToken).toHaveBeenCalledExactlyOnceWith({
      idToken: "id-token",
      expectedNonce: "nonce-value",
    });
    expect(signIn).toHaveBeenCalledExactlyOnceWith({
      provider: "GOOGLE",
      providerId: GOOGLE_USER.id,
      name: GOOGLE_USER.name,
      email: GOOGLE_USER.email,
      emailVerified: GOOGLE_USER.emailVerified,
      imageUrl: GOOGLE_USER.imageUrl,
    });
    expect(response.status).toBe(302);
    expect(response.headers.get("Location")).toBe("/invites/accept/invite-key");
    expectClearedOAuthCookies(response);

    const cookies = response.headers.getSetCookie();
    expect(cookies).toContainEqual(expect.stringContaining(`${SESSION_COOKIE_NAME}=session-id;`));
    expect(cookies).toContainEqual(expect.stringContaining(`${SIGNED_IN_FLAG_COOKIE_NAME}=1;`));
    expect(cookies).toContainEqual(
      expect.stringContaining("Expires=Tue, 01 Jan 2030 00:00:00 GMT"),
    );
  });

  test("redirects to the index without a destination", async () => {
    const response = await callback("?state=state-value&code=auth-code");

    expect(response.status).toBe(302);
    expect(response.headers.get("Location")).toBe("/");
  });

  test("redirects to sign-in as failed when the code exchange fails", async () => {
    vi.mocked(exchangeCode).mockRejectedValue(new Error("Bad code"));

    const response = await callback("?state=state-value&code=auth-code");

    expect(response.status).toBe(302);
    expect(response.headers.get("Location")).toBe("/sign-in?error=failed");
    expectClearedOAuthCookies(response);
    expect(signIn).not.toHaveBeenCalled();
    expect(response.headers.getSetCookie()).not.toContainEqual(
      expect.stringContaining(SESSION_COOKIE_NAME),
    );
  });

  test("redirects to sign-in as failed when the ID token is invalid", async () => {
    vi.mocked(verifyIdToken).mockRejectedValue(new Error("Invalid nonce"));

    const response = await callback("?state=state-value&code=auth-code");

    expect(response.status).toBe(302);
    expect(response.headers.get("Location")).toBe("/sign-in?error=failed");
    expect(signIn).not.toHaveBeenCalled();
  });
});
