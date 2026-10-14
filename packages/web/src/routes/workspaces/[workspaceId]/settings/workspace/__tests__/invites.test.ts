import { beforeEach, describe, expect, test, vi } from "vitest";
import route from "../invites";
import client from "@/api/client";
import { USER } from "@/test/fixtures/User";
import { WORKSPACE } from "@/test/fixtures/Workspace";
import { requestProperties, stubSignedIn, unwrapData, unwrapResponse } from "@/test/routes";

vi.mock("@/api/client", () => import("@/test/mocks/apiClient"));

const INVITES = {
  invites: [
    { id: "invite-id", email: "invitee@example.com", createdAt: "2025-01-01T00:00:00.000Z" },
  ],
  nextCursor: null,
};

const getWorkspace = vi.mocked(client.workspaces.get.query);
const listInvites = vi.mocked(client.workspaces.listInvites.query);
const getUserInfo = vi.mocked(client.users.getUserInfo.query);

function runLoader(parameters = { workspaceId: WORKSPACE.id }) {
  return route.loader(
    requestProperties({
      url: `http://localhost/workspaces/${WORKSPACE.id}/settings/workspace/invites`,
      parameters,
    }),
  );
}

describe("workspaces/[workspaceId]/settings/workspace/invites loader", () => {
  beforeEach(() => {
    getWorkspace.mockResolvedValue(WORKSPACE);
    listInvites.mockResolvedValue(INVITES);
    getUserInfo.mockResolvedValue(USER);
  });

  test("returns not found without a workspace id", async () => {
    const response = unwrapResponse(await runLoader({ workspaceId: "" }));
    expect(response.status).toBe(404);
    expect(listInvites).not.toHaveBeenCalled();
  });

  test("returns forbidden on the client when signed out", async () => {
    stubSignedIn(false);
    const response = unwrapResponse(await runLoader());
    expect(response.status).toBe(403);
    expect(listInvites).not.toHaveBeenCalled();
  });

  test("returns forbidden for workspace members", async () => {
    stubSignedIn(true);
    getWorkspace.mockResolvedValue({ ...WORKSPACE, role: "MEMBER" });

    const response = unwrapResponse(await runLoader());

    expect(response.status).toBe(403);
  });

  test("loads the pending invites for admins", async () => {
    stubSignedIn(true);

    const result = unwrapData(await runLoader());

    expect(getWorkspace).toHaveBeenCalledExactlyOnceWith({ workspaceId: WORKSPACE.id }, {});
    expect(listInvites).toHaveBeenCalledExactlyOnceWith({ workspaceId: WORKSPACE.id }, {});
    expect(getUserInfo).toHaveBeenCalledExactlyOnceWith(undefined, {});
    expect(result.title).toBe("Invites settings - Tiles");
    expect(result.data).toEqual({ workspace: WORKSPACE, invites: INVITES, user: USER });
  });
});
