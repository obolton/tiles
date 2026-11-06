import { afterEach, describe, expect, test, vi } from "vitest";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe("serverEnv", () => {
  test("cannot be loaded in the browser", async () => {
    await expect(import("../server")).rejects.toThrow(
      "Server environment variables are only available in the server context",
    );
  });

  test("loads during SSR", async () => {
    vi.stubEnv("SSR", true);

    const { serverEnv } = await import("../server");

    expect(serverEnv.INTERNAL_API_ORIGIN).toBe("https://internal.test");
  });
});
