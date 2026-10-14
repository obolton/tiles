import { beforeEach, describe, expect, test, vi } from "vitest";
import route from "../general";
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
      url: `http://localhost/workspaces/${WORKSPACE.id}/settings/workspace/general`,
      parameters,
    }),
  );
}

describe("workspaces/[workspaceId]/settings/workspace/general loader", () => {
  beforeEach(() => {
    getWorkspace.mockResolvedValue(WORKSPACE);
    getUserInfo.mockResolvedValue(USER);
  });

  test("returns not found without a workspace id", async () => {
    const response = unwrapResponse(await runLoader({ workspaceId: "" }));
    expect(response.status).toBe(404);
    expect(getWorkspace).not.toHaveBeenCalled();
  });

  test("returns forbidden on the client when signed out", async () => {
    stubSignedIn(false);
    const response = unwrapResponse(await runLoader());
    expect(response.status).toBe(403);
    expect(getWorkspace).not.toHaveBeenCalled();
  });

  test("loads the workspace and user", async () => {
    stubSignedIn(true);

    const result = unwrapData(await runLoader());

    expect(getWorkspace).toHaveBeenCalledExactlyOnceWith({ workspaceId: WORKSPACE.id }, {});
    expect(getUserInfo).toHaveBeenCalledExactlyOnceWith(undefined, {});
    expect(result.title).toBe("General settings - Tiles");
    expect(result.data).toEqual({ workspace: WORKSPACE, user: USER });
  });
});
