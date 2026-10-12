import { describe, expect, test, vi, beforeEach } from "vitest";
import { SESSION_COOKIE_NAME } from "api/constants/cookies";
import route from "../[key]";
import client from "@/api/client";

vi.mock("@/api/client", () => ({
  default: {
    workspaces: {
      acceptInvite: {
        mutate: vi.fn(),
      },
    },
  },
}));

const acceptInvite = vi.mocked(client.workspaces.acceptInvite.mutate);

async function get(key: string | undefined, cookie?: string) {
  return route.get({
    url: new URL(`http://localhost/invites/join-workspace/${key ?? ""}`),
    headers: new Headers(cookie ? { cookie } : {}),
    parameters: key ? { key } : {},
  });
}

describe("invites/join-workspace/[key]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("returns 404 without a key", async () => {
    const response = await get(undefined);
    expect(response.status).toBe(404);
    expect(acceptInvite).not.toHaveBeenCalled();
  });

  test("redirects signed-out users to sign in with the invite as destination", async () => {
    const response = await get("invite-key");
    expect(response.status).toBe(302);
    expect(response.headers.get("Location")).toBe(
      `/sign-in?destination=${encodeURIComponent("invites/join-workspace/invite-key")}`,
    );
    expect(acceptInvite).not.toHaveBeenCalled();
  });

  test("accepts the invite and redirects to the joined workspace", async () => {
    acceptInvite.mockResolvedValue({ workspaceId: "workspace-id" });
    const response = await get("invite-key", `${SESSION_COOKIE_NAME}=session-id`);
    expect(acceptInvite).toHaveBeenCalledWith(
      { key: "invite-key" },
      { context: { sessionId: "session-id" } },
    );
    expect(response.status).toBe(302);
    expect(response.headers.get("Location")).toBe("/workspaces/workspace-id");
  });
});
