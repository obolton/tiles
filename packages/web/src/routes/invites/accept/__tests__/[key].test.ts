import { describe, expect, test, vi } from "vitest";
import route from "../[key]";
import client from "@/api/client";
import { requestProperties, SESSION_COOKIE, SESSION_ID } from "@/test/routes";

vi.mock("@/api/client", () => import("@/test/mocks/apiClient"));

const acceptPageInvite = vi.mocked(client.collaboration.acceptPageInvite.mutate);

function get(key: string | undefined, cookie?: string) {
  return route.get(
    requestProperties({
      url: `http://localhost/invites/accept/${key ?? ""}`,
      cookie,
      parameters: key ? { key } : {},
    }),
  );
}

describe("invites/accept/[key]", () => {
  test("returns 404 without a key", async () => {
    const response = await get(undefined);
    expect(response.status).toBe(404);
    expect(acceptPageInvite).not.toHaveBeenCalled();
  });

  test("redirects signed-out users to sign in with the invite as destination", async () => {
    const response = await get("invite-key");
    expect(response.status).toBe(302);
    expect(response.headers.get("Location")).toBe(
      `/sign-in?destination=${encodeURIComponent("invites/accept/invite-key")}`,
    );
    expect(acceptPageInvite).not.toHaveBeenCalled();
  });

  test("accepts the invite and redirects to the shared page", async () => {
    acceptPageInvite.mockResolvedValue({ pageId: "page-id" });
    const response = await get("invite-key", SESSION_COOKIE);
    expect(acceptPageInvite).toHaveBeenCalledExactlyOnceWith(
      { key: "invite-key" },
      { context: { sessionId: SESSION_ID } },
    );
    expect(response.status).toBe(302);
    expect(response.headers.get("Location")).toBe("/pages/page-id");
  });
});
