import { describe, test, expect, vi, beforeEach, afterEach } from "vitest";
import { SERVICE_NAME_HEADER, SERVICE_TOKEN_HEADER } from "api/constants/headers";
import { fetchedUrl, jsonResponse } from "api/test/mocks/fetch";

const SIGN_IN_INPUT = {
  provider: "GOOGLE" as const,
  providerId: "google-123",
  name: "Test User",
  email: "test@example.com",
  emailVerified: true,
};

async function loadClient() {
  vi.resetModules();
  const { default: client } = await import("../client");
  return client;
}

function fetchedHeaders() {
  const [, options] = vi.mocked(fetch).mock.lastCall ?? [];
  return new Headers(options?.headers);
}

beforeEach(() => {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => jsonResponse([{ result: { data: null } }])),
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("client", () => {
  describe("in the browser", () => {
    test("uses the public API origin", async () => {
      const client = await loadClient();
      await client.auth.signOut.mutate();

      expect(fetchedUrl().origin).toBe("https://api.test");
    });

    test("sends the session as a bearer token", async () => {
      const client = await loadClient();
      await client.auth.signOut.mutate(undefined, { context: { sessionId: "session-1" } });

      expect(fetchedHeaders().get("Authorization")).toBe("Bearer session-1");
    });

    test("never sends service credentials", async () => {
      vi.stubEnv("SERVICE_API_TOKEN", "secret");
      const client = await loadClient();
      await client.auth.signIn.mutate(SIGN_IN_INPUT, { context: { service: true } });

      const headers = fetchedHeaders();
      expect(headers.get(SERVICE_TOKEN_HEADER)).toBeNull();
      expect(headers.get(SERVICE_NAME_HEADER)).toBeNull();
    });
  });

  describe("during SSR", () => {
    beforeEach(() => {
      vi.stubEnv("SSR", true);
      vi.stubEnv("INTERNAL_API_ORIGIN", "https://internal.test");
      vi.stubEnv("SERVICE_API_TOKEN", "secret");
    });

    test("uses the internal API origin", async () => {
      const client = await loadClient();
      await client.auth.signOut.mutate();

      expect(fetchedUrl().origin).toBe("https://internal.test");
    });

    test("sends service credentials for service calls", async () => {
      const client = await loadClient();
      await client.auth.signIn.mutate(SIGN_IN_INPUT, { context: { service: true } });

      const headers = fetchedHeaders();
      expect(headers.get(SERVICE_TOKEN_HEADER)).toBe("secret");
      expect(headers.get(SERVICE_NAME_HEADER)).toBe("web");
      expect(headers.get("Authorization")).toBeNull();
    });

    test("does not send service credentials for regular calls", async () => {
      const client = await loadClient();
      await client.auth.signOut.mutate(undefined, { context: { sessionId: "session-1" } });

      const headers = fetchedHeaders();
      expect(headers.get(SERVICE_TOKEN_HEADER)).toBeNull();
      expect(headers.get(SERVICE_NAME_HEADER)).toBeNull();
      expect(headers.get("Authorization")).toBe("Bearer session-1");
    });

    test("fails service calls without a service token", async () => {
      vi.stubEnv("SERVICE_API_TOKEN", "");
      const client = await loadClient();

      await expect(
        client.auth.signIn.mutate(SIGN_IN_INPUT, { context: { service: true } }),
      ).rejects.toThrow("SERVICE_API_TOKEN environment variable is required");
      expect(fetch).not.toHaveBeenCalled();
    });

    test("requires the internal API origin", async () => {
      vi.stubEnv("INTERNAL_API_ORIGIN", "");

      await expect(loadClient()).rejects.toThrow(
        "INTERNAL_API_ORIGIN environment variable is required",
      );
    });
  });
});
