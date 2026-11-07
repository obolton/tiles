import { describe, expect, test, vi } from "vitest";
import { GET } from "../callback";

vi.mock("@/auth/google", () => ({ exchangeCode: vi.fn(), verifyIdToken: vi.fn() }));
vi.mock("@/auth/sessions", () => ({ signIn: vi.fn(), setAuthenticationCookies: vi.fn() }));

const PAGE_ID = "b8c96309-cc54-445b-a274-98b6be12c43f";

async function get(url: string, cookie?: string) {
  return GET({
    url: new URL(url),
    headers: new Headers(cookie ? { cookie } : {}),
    parameters: {},
  });
}

describe("GET /sign-in/google/callback", () => {
  test("redirects to the sign-in page when the user cancels", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const response = await get("http://localhost/sign-in/google/callback?error=access_denied");
    expect(response.status).toBe(302);
    expect(response.headers.get("Location")).toBe("/sign-in?error=cancelled");
  });

  test("keeps the destination when redirecting with an error", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const response = await get(
      "http://localhost/sign-in/google/callback?error=server_error",
      `__Host-oauth_dest=pages%2F${PAGE_ID}`,
    );
    expect(response.headers.get("Location")).toBe(
      `/sign-in?error=failed&destination=pages%2F${PAGE_ID}`,
    );
  });

  test("drops an invalid destination cookie and reports a failed sign-in", async () => {
    const response = await get(
      "http://localhost/sign-in/google/callback?error=access_denied",
      "__Host-oauth_dest=https%3A%2F%2Fevil.com",
    );
    expect(response.status).toBe(302);
    expect(response.headers.get("Location")).toBe("/sign-in?error=failed");
    expect(response.headers.get("Set-Cookie")).toContain("__Host-oauth_dest=;");
  });

  test("reports a failed sign-in when the OAuth state does not match", async () => {
    const response = await get(
      "http://localhost/sign-in/google/callback?state=other&code=abc",
      [
        "__Host-oauth_state=expected",
        "__Host-oauth_verifier=verifier",
        "__Host-oauth_nonce=nonce",
        `__Host-oauth_dest=pages%2F${PAGE_ID}`,
      ].join("; "),
    );
    expect(response.status).toBe(302);
    expect(response.headers.get("Location")).toBe(
      `/sign-in?error=failed&destination=pages%2F${PAGE_ID}`,
    );
    expect(response.headers.get("Set-Cookie")).toContain("__Host-oauth_state=;");
  });
});
