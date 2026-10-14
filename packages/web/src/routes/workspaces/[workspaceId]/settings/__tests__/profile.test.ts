import { beforeEach, describe, expect, test, vi } from "vitest";
import route from "../profile";
import client from "@/api/client";
import { USER } from "@/test/fixtures/User";
import { WORKSPACE } from "@/test/fixtures/Workspace";
import { requestProperties, stubSignedIn, unwrapData, unwrapResponse } from "@/test/routes";

vi.mock("@/api/client", () => import("@/test/mocks/apiClient"));

const getWorkspace = vi.mocked(client.workspaces.get.query);
const getUserInfo = vi.mocked(client.users.getUserInfo.query);

function runLoader(parameters = { workspaceId: WORKSPACE.id }) {
  return route.loader(
    requestProperties({
      url: `http://localhost/workspaces/${WORKSPACE.id}/settings/profile`,
      parameters,
    }),
  );
}

describe("workspaces/[workspaceId]/settings/profile loader", () => {
  beforeEach(() => {
    getWorkspace.mockResolvedValue(WORKSPACE);
    getUserInfo.mockResolvedValue(USER);
  });

  test("returns not found without a workspace id", async () => {
    const response = unwrapResponse(await runLoader({ workspaceId: "" }));
    expect(response.status).toBe(404);
    expect(getUserInfo).not.toHaveBeenCalled();
  });

  test("returns forbidden on the client when signed out", async () => {
    stubSignedIn(false);
    const response = unwrapResponse(await runLoader());
    expect(response.status).toBe(403);
    expect(getUserInfo).not.toHaveBeenCalled();
  });

  test("loads the user and flags workspace admins", async () => {
    stubSignedIn(true);

    const result = unwrapData(await runLoader());

    expect(getUserInfo).toHaveBeenCalledExactlyOnceWith(undefined, {});
    expect(getWorkspace).toHaveBeenCalledExactlyOnceWith({ workspaceId: WORKSPACE.id }, {});
    expect(result.title).toBe("Profile settings - Tiles");
    expect(result.data).toEqual({ workspaceId: WORKSPACE.id, user: USER, isAdmin: true });
  });

  test("does not flag members as admins", async () => {
    stubSignedIn(true);
    getWorkspace.mockResolvedValue({ ...WORKSPACE, role: "MEMBER" });

    const result = unwrapData(await runLoader());

    expect(result.data.isAdmin).toBe(false);
  });
});
