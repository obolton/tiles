import { beforeEach, describe, expect, test, vi } from "vitest";
import route from "../members";
import client from "@/api/client";
import { USER } from "@/test/fixtures/User";
import { WORKSPACE } from "@/test/fixtures/Workspace";
import { requestProperties, stubSignedIn, unwrapData, unwrapResponse } from "@/test/routes";

vi.mock("@/api/client", () => import("@/test/mocks/apiClient"));

const USERS = {
  users: [
    {
      id: USER.id,
      name: USER.name,
      email: USER.email,
      imageUrl: USER.imageUrl,
      role: "ADMIN" as const,
    },
  ],
  nextCursor: null,
};

const getWorkspace = vi.mocked(client.workspaces.get.query);
const listUsers = vi.mocked(client.workspaces.listUsers.query);
const getUserInfo = vi.mocked(client.users.getUserInfo.query);

function runLoader(parameters = { workspaceId: WORKSPACE.id }) {
  return route.loader(
    requestProperties({
      url: `http://localhost/workspaces/${WORKSPACE.id}/settings/workspace/members`,
      parameters,
    }),
  );
}

describe("workspaces/[workspaceId]/settings/workspace/members loader", () => {
  beforeEach(() => {
    getWorkspace.mockResolvedValue(WORKSPACE);
    listUsers.mockResolvedValue(USERS);
    getUserInfo.mockResolvedValue(USER);
  });

  test("returns not found without a workspace id", async () => {
    const response = unwrapResponse(await runLoader({ workspaceId: "" }));
    expect(response.status).toBe(404);
    expect(listUsers).not.toHaveBeenCalled();
  });

  test("returns forbidden on the client when signed out", async () => {
    stubSignedIn(false);
    const response = unwrapResponse(await runLoader());
    expect(response.status).toBe(403);
    expect(listUsers).not.toHaveBeenCalled();
  });

  test("loads the workspace members", async () => {
    stubSignedIn(true);

    const result = unwrapData(await runLoader());

    expect(getWorkspace).toHaveBeenCalledExactlyOnceWith({ workspaceId: WORKSPACE.id }, {});
    expect(listUsers).toHaveBeenCalledExactlyOnceWith({ workspaceId: WORKSPACE.id }, {});
    expect(getUserInfo).toHaveBeenCalledExactlyOnceWith(undefined, {});
    expect(result.title).toBe("Members settings - Tiles");
    expect(result.data).toEqual({ workspace: WORKSPACE, users: USERS, user: USER });
  });
});
