import { describe, expect, test, vi } from "vitest";
import { httpBatchLink } from "@trpc/client";
import { createClient } from "../client";

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
    createClient("test-session");

    expect(httpBatchLink).toHaveBeenCalledWith(
      expect.objectContaining({
        url: "https://api.example.com",
      }),
    );
  });

  test("includes Authorization header with session ID", () => {
    createClient("my-session-id");

    const config = getLastLinkConfig();
    const headers = (config.headers as () => Record<string, string>)();

    expect(headers.Authorization).toBe("Bearer my-session-id");
  });
});
