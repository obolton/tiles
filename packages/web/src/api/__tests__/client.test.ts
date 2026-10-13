import { describe, test, expect, vi, beforeEach, afterEach } from "vitest";
import { SERVICE_NAME_HEADER, SERVICE_TOKEN_HEADER } from "api/constants/headers";

const SIGN_IN_INPUT = {
  provider: "GOOGLE" as const,
  providerId: "google-123",
  name: "Test User",
  email: "test@example.com",
  emailVerified: true,
};

const fetchMock = vi.fn<typeof fetch>(
  async () =>
    new Response(JSON.stringify([{ result: { data: null } }]), {
      headers: { "content-type": "application/json" },
    }),
);

async function loadClient() {
  vi.resetModules();
  const { default: client } = await import("../client");
  return client;
}

function getRequest() {
  expect(fetchMock).toHaveBeenCalledTimes(1);
  const call = fetchMock.mock.calls[0];
  if (!call) {
    throw new Error("fetch was not called");
  }
  const [input, options] = call;
  return { url: new Request(input).url, headers: new Headers(options?.headers) };
}

beforeEach(() => {
  fetchMock.mockClear();
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("client", () => {
  describe("in the browser", () => {
    test("should use the public API origin", async () => {
      const client = await loadClient();
      await client.auth.signOut.mutate();

      expect(getRequest().url).toMatch(/^https:\/\/api\.test\//);
    });

    test("should send the session as a bearer token", async () => {
      const client = await loadClient();
      await client.auth.signOut.mutate(undefined, { context: { sessionId: "session-1" } });

      expect(getRequest().headers.get("Authorization")).toBe("Bearer session-1");
    });

    test("should never send service credentials", async () => {
      vi.stubEnv("SERVICE_API_TOKEN", "secret");
      const client = await loadClient();
      await client.auth.signIn.mutate(SIGN_IN_INPUT, { context: { service: true } });

      const { headers } = getRequest();
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

    test("should use the internal API origin", async () => {
      const client = await loadClient();
      await client.auth.signOut.mutate();

      expect(getRequest().url).toMatch(/^https:\/\/internal\.test\//);
    });

    test("should send service credentials for service calls", async () => {
      const client = await loadClient();
      await client.auth.signIn.mutate(SIGN_IN_INPUT, { context: { service: true } });

      const { headers } = getRequest();
      expect(headers.get(SERVICE_TOKEN_HEADER)).toBe("secret");
      expect(headers.get(SERVICE_NAME_HEADER)).toBe("web");
      expect(headers.get("Authorization")).toBeNull();
    });

    test("should not send service credentials for regular calls", async () => {
      const client = await loadClient();
      await client.auth.signOut.mutate(undefined, { context: { sessionId: "session-1" } });

      const { headers } = getRequest();
      expect(headers.get(SERVICE_TOKEN_HEADER)).toBeNull();
      expect(headers.get(SERVICE_NAME_HEADER)).toBeNull();
      expect(headers.get("Authorization")).toBe("Bearer session-1");
    });

    test("should fail service calls without a service token", async () => {
      vi.stubEnv("SERVICE_API_TOKEN", "");
      const client = await loadClient();

      await expect(
        client.auth.signIn.mutate(SIGN_IN_INPUT, { context: { service: true } }),
      ).rejects.toThrow("SERVICE_API_TOKEN environment variable is required");
      expect(fetchMock).not.toHaveBeenCalled();
    });

    test("should require the internal API origin", async () => {
      vi.stubEnv("INTERNAL_API_ORIGIN", "");

      await expect(loadClient()).rejects.toThrow(
        "INTERNAL_API_ORIGIN environment variable is required",
      );
    });
  });
});
