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

async function loadServiceClient() {
  vi.resetModules();
  const { default: serviceClient } = await import("../serviceClient");
  return serviceClient;
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

describe("serviceClient", () => {
  test("cannot be loaded in the browser", async () => {
    vi.stubEnv("SERVICE_API_TOKEN", "secret");
    vi.stubEnv("INTERNAL_API_ORIGIN", "https://internal.test");

    await expect(loadServiceClient()).rejects.toThrow(
      "The service API client is only available during SSR",
    );
    expect(fetch).not.toHaveBeenCalled();
  });

  describe("during SSR", () => {
    beforeEach(() => {
      vi.stubEnv("SSR", true);
      vi.stubEnv("INTERNAL_API_ORIGIN", "https://internal.test");
      vi.stubEnv("SERVICE_API_TOKEN", "secret");
    });

    test("uses the internal API origin", async () => {
      const serviceClient = await loadServiceClient();
      await serviceClient.auth.signIn.mutate(SIGN_IN_INPUT);

      expect(fetchedUrl().origin).toBe("https://internal.test");
    });

    test("sends service credentials on every call", async () => {
      const serviceClient = await loadServiceClient();
      await serviceClient.auth.signIn.mutate(SIGN_IN_INPUT);

      const headers = fetchedHeaders();
      expect(headers.get(SERVICE_TOKEN_HEADER)).toBe("secret");
      expect(headers.get(SERVICE_NAME_HEADER)).toBe("web");
      expect(headers.get("Authorization")).toBeNull();
    });

    test("requires the service token", async () => {
      vi.stubEnv("SERVICE_API_TOKEN", "");

      await expect(loadServiceClient()).rejects.toThrow("SERVICE_API_TOKEN is not defined");
    });

    test("requires the internal API origin", async () => {
      vi.stubEnv("INTERNAL_API_ORIGIN", "");

      await expect(loadServiceClient()).rejects.toThrow("INTERNAL_API_ORIGIN is not defined");
    });
  });
});
