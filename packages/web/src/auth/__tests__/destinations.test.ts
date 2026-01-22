import { describe, it, expect } from "vitest";
import { validateDestination, isAbsoluteUrl } from "../destinations";

describe("validateDestination", () => {
  describe("relative paths", () => {
    it("should accept valid invite paths", () => {
      expect(validateDestination("invites/accept/abc-DEF123_")).toBe(true);
    });

    it("should reject invalid paths", () => {
      expect(validateDestination("")).toBe(false);
      expect(validateDestination("/")).toBe(false);
      expect(validateDestination("invalid/path")).toBe(false);
      expect(validateDestination("invites/accept/")).toBe(false);
      expect(validateDestination("invites/accept/abc/abc")).toBe(false);
      expect(validateDestination("/invites/accept/abc")).toBe(false);
      expect(validateDestination("invites/accept/abc!")).toBe(false);
      expect(validateDestination("invites/accept/abc def")).toBe(false);
      expect(validateDestination("INVITES/accept/abc")).toBe(false);
    });
  });

  describe("localhost origins (multi-instance local dev)", () => {
    it("should accept localhost with port", () => {
      expect(validateDestination("https://localhost:5173")).toBe(true);
      expect(validateDestination("http://localhost:3000")).toBe(true);
      expect(validateDestination("https://localhost:8080")).toBe(true);
    });

    it("should accept localhost without port", () => {
      expect(validateDestination("https://localhost")).toBe(true);
      expect(validateDestination("http://localhost")).toBe(true);
    });

    it("should accept localhost subdomains", () => {
      expect(validateDestination("https://foo.localhost:5173")).toBe(true);
      expect(validateDestination("https://bar.localhost:5173")).toBe(true);
      expect(validateDestination("https://my-branch.localhost:5173")).toBe(
        true,
      );
      expect(validateDestination("http://feature-123.localhost:3000")).toBe(
        true,
      );
    });

    it("should accept localhost subdomains without port", () => {
      expect(validateDestination("https://foo.localhost")).toBe(true);
      expect(validateDestination("http://bar.localhost")).toBe(true);
    });

    it("should reject non-localhost URLs", () => {
      expect(validateDestination("https://example.com")).toBe(false);
      expect(validateDestination("https://evil.com:5173")).toBe(false);
      expect(validateDestination("https://localhost.evil.com")).toBe(false);
      expect(validateDestination("https://notlocalhost:5173")).toBe(false);
    });

    it("should reject URLs with paths or query strings", () => {
      // Origin validation only - no paths allowed
      expect(validateDestination("https://localhost:5173/path")).toBe(false);
      expect(validateDestination("https://localhost:5173?query=1")).toBe(false);
      expect(validateDestination("https://foo.localhost:5173/callback")).toBe(
        false,
      );
    });

    it("should reject deeply nested subdomains", () => {
      // Only single-level subdomains are allowed for security
      expect(validateDestination("https://a.b.localhost:5173")).toBe(false);
      expect(validateDestination("https://foo.bar.localhost:5173")).toBe(false);
    });
  });
});

describe("isAbsoluteUrl", () => {
  it("should return true for absolute URLs", () => {
    expect(isAbsoluteUrl("https://localhost:5173")).toBe(true);
    expect(isAbsoluteUrl("http://example.com")).toBe(true);
    expect(isAbsoluteUrl("https://foo.localhost:5173")).toBe(true);
  });

  it("should return false for relative paths", () => {
    expect(isAbsoluteUrl("invites/accept/abc")).toBe(false);
    expect(isAbsoluteUrl("/path")).toBe(false);
    expect(isAbsoluteUrl("")).toBe(false);
    expect(isAbsoluteUrl("path/to/resource")).toBe(false);
  });
});
