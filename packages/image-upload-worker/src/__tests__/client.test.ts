import { describe, expect, test, vi } from "vitest";
import { httpBatchLink } from "@trpc/client";
import { createClient } from "../client";

const API_ORIGIN = "https://api.example.com";

vi.mock("@trpc/client", () => ({
  createTRPCClient: vi.fn(),
  httpBatchLink: vi.fn(),
}));

function getLastLinkConfig() {
  const calls = vi.mocked(httpBatchLink).mock.calls;
  return calls[calls.length - 1]![0];
}

describe("createClient", () => {
  test("configures link with API origin", () => {
    createClient(API_ORIGIN, "test-session");

    expect(httpBatchLink).toHaveBeenCalledWith(
      expect.objectContaining({
        url: "https://api.example.com",
      }),
    );
  });

  test("includes Authorization header with session ID", () => {
    createClient(API_ORIGIN, "my-session-id");

    const config = getLastLinkConfig();
    const headers = (config.headers as () => Record<string, string>)();

    expect(headers.Authorization).toBe("Bearer my-session-id");
  });
});
