import { describe, test, expect, vi, beforeEach } from "vitest";
import { getGoogleAuthorizationUrl, exchangeCode, verifyIdToken } from "../google";
import { jwtVerify } from "jose";
import * as oauth2 from "../oauth2";

vi.mock("jose");

describe("google", () => {
  describe("getGoogleAuthorizationUrl", () => {
    test("should return a valid Google authorization URL", () => {
      const { url } = getGoogleAuthorizationUrl();
      const parsedUrl = new URL(url);

      expect(parsedUrl.origin).toBe("https://localhost");
      expect(parsedUrl.pathname).toBe("/sign-in/google");
      expect(parsedUrl.searchParams.get("response_type")).toBe("code");
      expect(parsedUrl.searchParams.get("client_id")).toBe(process.env.GOOGLE_CLIENT_ID);
      expect(parsedUrl.searchParams.get("redirect_uri")).toBe(process.env.GOOGLE_REDIRECT_URI);
      expect(parsedUrl.searchParams.get("scope")).toBe("openid profile email");
      expect(parsedUrl.searchParams.get("access_type")).toBe("online");
      expect(parsedUrl.searchParams.get("code_challenge_method")).toBe("S256");
    });

    test("should include state in URL and return value", () => {
      const { url, state } = getGoogleAuthorizationUrl();
      const parsedUrl = new URL(url);

      expect(state).toMatch(/^[\w-]+$/);
      expect(parsedUrl.searchParams.get("state")).toBe(state);
    });

    test("should include PKCE code challenge derived from verifier", () => {
      const { url, verifier } = getGoogleAuthorizationUrl();
      const parsedUrl = new URL(url);

      expect(verifier).toMatch(/^[\w-]+$/);
      expect(parsedUrl.searchParams.get("code_challenge")).toMatch(/^[\w-]{43}$/);
    });

    test("should include nonce in URL and return value", () => {
      const { url, nonce } = getGoogleAuthorizationUrl();
      const parsedUrl = new URL(url);

      expect(nonce).toMatch(/^[\w-]+$/);
      expect(parsedUrl.searchParams.get("nonce")).toBe(nonce);
    });

    test("should generate unique values for each call", () => {
      const first = getGoogleAuthorizationUrl();
      const second = getGoogleAuthorizationUrl();

      expect(first.state).not.toBe(second.state);
      expect(first.verifier).not.toBe(second.verifier);
      expect(first.nonce).not.toBe(second.nonce);
    });
  });

  describe("exchangeCode", () => {
    beforeEach(() => {
      vi.spyOn(oauth2, "getOAuth2AccessToken").mockResolvedValue({
        accessToken: "mock-access-token",
        idToken: "mock-id-token",
      });
    });

    test("should exchange code for tokens", async () => {
      const result = await exchangeCode({
        code: "auth-code",
        codeVerifier: "code-verifier",
      });

      expect(oauth2.getOAuth2AccessToken).toHaveBeenCalledWith({
        endpoint: "https://oauth2.googleapis.com/token",
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        redirectUri: process.env.GOOGLE_REDIRECT_URI,
        code: "auth-code",
        codeVerifier: "code-verifier",
      });
      expect(result).toEqual({
        accessToken: "mock-access-token",
        idToken: "mock-id-token",
      });
    });
  });

  describe("verifyIdToken", () => {
    test("should verify the ID token and return user info", async () => {
      vi.mocked(jwtVerify).mockResolvedValue({
        payload: {
          sub: "user-123",
          name: "Test User",
          email: "test@example.com",
          email_verified: true,
          picture: "https://example.com/photo.jpg",
          nonce: "expected-nonce",
        },
        protectedHeader: { alg: "RS256" },
        key: {} as never,
      });

      const result = await verifyIdToken({
        idToken: "mock-id-token",
        expectedNonce: "expected-nonce",
      });

      expect(jwtVerify).toHaveBeenCalled();
      expect(result).toEqual({
        id: "user-123",
        name: "Test User",
        email: "test@example.com",
        emailVerified: true,
        imageUrl: "https://example.com/photo.jpg",
      });
    });

    test("should throw an error if nonce does not match", async () => {
      vi.mocked(jwtVerify).mockResolvedValue({
        payload: {
          sub: "user-123",
          name: "Test User",
          email: "test@example.com",
          email_verified: true,
          picture: "https://example.com/photo.jpg",
          nonce: "wrong-nonce",
        },
        protectedHeader: { alg: "RS256" },
        key: {} as never,
      });

      await expect(
        verifyIdToken({
          idToken: "mock-id-token",
          expectedNonce: "expected-nonce",
        }),
      ).rejects.toThrow("Invalid nonce in ID token");
    });

    test("should throw an error if required claims are missing", async () => {
      vi.mocked(jwtVerify).mockResolvedValue({
        payload: {
          sub: "user-123",
          name: "Test User",
          nonce: "expected-nonce",
        },
        protectedHeader: { alg: "RS256" },
        key: {} as never,
      });

      await expect(
        verifyIdToken({
          idToken: "mock-id-token",
          expectedNonce: "expected-nonce",
        }),
      ).rejects.toThrow("Invalid claims in ID token");
    });

    test("should throw an error if claims have wrong types", async () => {
      vi.mocked(jwtVerify).mockResolvedValue({
        payload: {
          sub: "user-123",
          name: "Test User",
          email: "test@example.com",
          email_verified: "true",
          picture: "https://example.com/photo.jpg",
          nonce: "expected-nonce",
        },
        protectedHeader: { alg: "RS256" },
        key: {} as never,
      });

      await expect(
        verifyIdToken({
          idToken: "mock-id-token",
          expectedNonce: "expected-nonce",
        }),
      ).rejects.toThrow("Invalid claims in ID token");
    });

    test("should propagate jose verification errors", async () => {
      vi.mocked(jwtVerify).mockRejectedValue(new Error("JWT verification failed"));

      await expect(
        verifyIdToken({
          idToken: "invalid-token",
          expectedNonce: "expected-nonce",
        }),
      ).rejects.toThrow("JWT verification failed");
    });
  });
});
