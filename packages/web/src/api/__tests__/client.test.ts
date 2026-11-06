import { describe, test, expect, vi, beforeEach, afterEach } from "vitest";
import { SERVICE_TOKEN_HEADER } from "api/constants/headers";
import { fetchedUrl, jsonResponse } from "api/test/mocks/fetch";

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

    test("never sends the service token", async () => {
      const client = await loadClient();
      await client.auth.signOut.mutate(undefined, { context: { sessionId: "session-1" } });

      const headers = fetchedHeaders();
      expect(headers.get(SERVICE_TOKEN_HEADER)).toBeNull();
      expect(headers.get("Authorization")).toBe("Bearer session-1");
    });
  });
});
