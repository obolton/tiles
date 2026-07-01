import { describe, it, expect } from "vitest";
import {
  getOAuth2AuthorizationUrl,
  getOAuth2Cookies,
  setOAuth2Cookies,
  clearOAuth2Cookies,
  compareOAuth2State,
} from "../oauth2";

describe("oauth2", () => {
  describe("getOAuth2AuthorizationUrl", () => {
    const baseConfig = {
      endpoint: "https://auth.example.com/authorize",
      clientId: "test-client-id",
      scope: ["openid", "profile"],
      redirectUri: "https://app.example.com/callback",
      otherAttributes: {},
    };

    it("should generate a valid authorization URL", () => {
      const { url } = getOAuth2AuthorizationUrl(baseConfig);
      const parsedUrl = new URL(url);

      expect(parsedUrl.origin).toBe("https://auth.example.com");
      expect(parsedUrl.pathname).toBe("/authorize");
      expect(parsedUrl.searchParams.get("response_type")).toBe("code");
      expect(parsedUrl.searchParams.get("client_id")).toBe("test-client-id");
      expect(parsedUrl.searchParams.get("scope")).toBe("openid profile");
      expect(parsedUrl.searchParams.get("redirect_uri")).toBe("https://app.example.com/callback");
    });

    it("should include PKCE parameters", () => {
      const { url, verifier } = getOAuth2AuthorizationUrl(baseConfig);
      const parsedUrl = new URL(url);

      expect(verifier).toBeTruthy();
      expect(parsedUrl.searchParams.get("code_challenge")).toBeTruthy();
      expect(parsedUrl.searchParams.get("code_challenge_method")).toBe("S256");
    });

    it("should include state parameter", () => {
      const { url, state } = getOAuth2AuthorizationUrl(baseConfig);
      const parsedUrl = new URL(url);

      expect(state).toBeTruthy();
      expect(parsedUrl.searchParams.get("state")).toBe(state);
    });

    it("should include nonce parameter", () => {
      const { url, nonce } = getOAuth2AuthorizationUrl(baseConfig);
      const parsedUrl = new URL(url);

      expect(nonce).toBeTruthy();
      expect(parsedUrl.searchParams.get("nonce")).toBe(nonce);
    });

    it("should include custom attributes", () => {
      const { url } = getOAuth2AuthorizationUrl({
        ...baseConfig,
        otherAttributes: {
          access_type: "offline",
          prompt: "consent",
        },
      });
      const parsedUrl = new URL(url);

      expect(parsedUrl.searchParams.get("access_type")).toBe("offline");
      expect(parsedUrl.searchParams.get("prompt")).toBe("consent");
    });

    it("should generate unique values for each call", () => {
      const first = getOAuth2AuthorizationUrl(baseConfig);
      const second = getOAuth2AuthorizationUrl(baseConfig);

      expect(first.state).not.toBe(second.state);
      expect(first.verifier).not.toBe(second.verifier);
      expect(first.nonce).not.toBe(second.nonce);
    });
  });

  describe("compareOAuth2State", () => {
    it("should return true for matching states", () => {
      expect(compareOAuth2State("abc123", "abc123")).toBe(true);
    });

    it("should return false for non-matching states", () => {
      expect(compareOAuth2State("abc123", "xyz789")).toBe(false);
    });

    it("should return false for different lengths", () => {
      expect(compareOAuth2State("abc", "abcd")).toBe(false);
    });

    it("should handle empty strings", () => {
      expect(compareOAuth2State("", "")).toBe(true);
      expect(compareOAuth2State("", "a")).toBe(false);
    });
  });

  describe("cookie functions", () => {
    describe("setOAuth2Cookies", () => {
      it("should set state, verifier, nonce, and destination cookies", () => {
        const cookies = setOAuth2Cookies({
          state: "test-state",
          verifier: "test-verifier",
          nonce: "test-nonce",
          destination: "test-destination",
        });

        expect(cookies).toHaveLength(4);
        expect(cookies.every(([name]) => name === "Set-Cookie")).toBe(true);

        const cookieValues = cookies.map(([, value]) => value);
        expect(cookieValues.some((v) => v.includes("__Host-oauth_state=test-state"))).toBe(true);
        expect(cookieValues.some((v) => v.includes("__Host-oauth_verifier=test-verifier"))).toBe(
          true,
        );
        expect(cookieValues.some((v) => v.includes("__Host-oauth_nonce=test-nonce"))).toBe(true);
        expect(cookieValues.some((v) => v.includes("__Host-oauth_dest=test-destination"))).toBe(
          true,
        );
      });

      it("should set secure cookie options", () => {
        const cookies = setOAuth2Cookies({
          state: "test-state",
          verifier: "test-verifier",
          nonce: "test-nonce",
          destination: "",
        });

        const stateCookie = cookies.find(([, v]) => v.includes("__Host-oauth_state"))?.[1];
        expect(stateCookie).toContain("HttpOnly");
        expect(stateCookie).toContain("Secure");
        expect(stateCookie).toContain("SameSite=Lax");
      });
    });

    describe("clearOAuth2Cookies", () => {
      it("should clear all OAuth cookies", () => {
        const cookies = clearOAuth2Cookies();

        expect(cookies).toHaveLength(4);
        const cookieValues = cookies.map(([, value]) => value);
        expect(cookieValues.every((v) => v.includes("Max-Age=0"))).toBe(true);
      });
    });

    describe("getOAuth2Cookies", () => {
      it("should parse all OAuth2 cookies", () => {
        const cookieString =
          "__Host-oauth_state=state-value; __Host-oauth_verifier=verifier-value; __Host-oauth_nonce=nonce-value; __Host-oauth_dest=dest-value";

        const cookies = getOAuth2Cookies(cookieString);

        expect(cookies.state).toBe("state-value");
        expect(cookies.verifier).toBe("verifier-value");
        expect(cookies.nonce).toBe("nonce-value");
        expect(cookies.destination).toBe("dest-value");
      });

      it("should return null for missing cookies", () => {
        const cookies = getOAuth2Cookies("");

        expect(cookies.state).toBeNull();
        expect(cookies.verifier).toBeNull();
        expect(cookies.nonce).toBeNull();
        expect(cookies.destination).toBeNull();
      });

      it("should handle partial cookie strings", () => {
        const cookies = getOAuth2Cookies("__Host-oauth_state=only-state");

        expect(cookies.state).toBe("only-state");
        expect(cookies.verifier).toBeNull();
      });
    });
  });
});
