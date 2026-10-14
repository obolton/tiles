import { beforeEach, describe, expect, test, vi } from "vitest";
import route from "../index";
import { getGoogleAuthorizationUrl } from "@/auth/google";
import { requestProperties } from "@/test/routes";

vi.mock("@/auth/google", () => ({ getGoogleAuthorizationUrl: vi.fn() }));

const AUTHORIZATION = {
  url: "https://accounts.example/o/oauth2/auth?client_id=test",
  state: "state-value",
  verifier: "verifier-value",
  nonce: "nonce-value",
};

function get(search = "") {
  return route.get(requestProperties({ url: `http://localhost/sign-in/google${search}` }));
}

describe("sign-in/google", () => {
  beforeEach(() => {
    vi.mocked(getGoogleAuthorizationUrl).mockReturnValue(AUTHORIZATION);
  });

  test("redirects to Google with the OAuth state stored in cookies", async () => {
    const response = await get("?destination=invites%2Faccept%2Finvite-key");

    expect(response.status).toBe(302);
    expect(response.headers.get("Location")).toBe(AUTHORIZATION.url);

    const cookies = response.headers.getSetCookie();
    expect(cookies).toHaveLength(4);
    expect(cookies).toContainEqual(expect.stringContaining("__Host-oauth_state=state-value;"));
    expect(cookies).toContainEqual(
      expect.stringContaining("__Host-oauth_verifier=verifier-value;"),
    );
    expect(cookies).toContainEqual(expect.stringContaining("__Host-oauth_nonce=nonce-value;"));
    expect(cookies).toContainEqual(
      expect.stringContaining("__Host-oauth_dest=invites/accept/invite-key;"),
    );
    for (const cookie of cookies) {
      expect(cookie).toContain("Max-Age=600; Path=/; HttpOnly; Secure; SameSite=Lax");
    }
  });

  test("stores an empty destination when none is requested", async () => {
    const response = await get();

    expect(response.headers.getSetCookie()).toContainEqual(
      expect.stringContaining("__Host-oauth_dest=;"),
    );
  });
});
