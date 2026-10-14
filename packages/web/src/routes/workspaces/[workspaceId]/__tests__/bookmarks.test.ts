import { beforeEach, describe, expect, test, vi } from "vitest";
import route from "../bookmarks";
import client from "@/api/client";
import { USER } from "@/test/fixtures/User";
import { WORKSPACE } from "@/test/fixtures/Workspace";
import { requestProperties, stubSignedIn, unwrapData, unwrapResponse } from "@/test/routes";

vi.mock("@/api/client", () => import("@/test/mocks/apiClient"));

const FOLDERS = { folders: [], nextCursor: null };
const PAGES = { pages: [], nextCursor: null };

const getWorkspace = vi.mocked(client.workspaces.get.query);
const listFolders = vi.mocked(client.folders.list.query);
const listPages = vi.mocked(client.bookmarks.list.query);
const getUserInfo = vi.mocked(client.users.getUserInfo.query);

function runLoader(parameters = { workspaceId: WORKSPACE.id }) {
  return route.loader(
    requestProperties({ url: `http://localhost/workspaces/${WORKSPACE.id}/bookmarks`, parameters }),
  );
}

describe("workspaces/[workspaceId]/bookmarks loader", () => {
  beforeEach(() => {
    getWorkspace.mockResolvedValue(WORKSPACE);
    listFolders.mockResolvedValue(FOLDERS);
    listPages.mockResolvedValue(PAGES);
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

  test("loads the workspace, folders, pages and user", async () => {
    stubSignedIn(true);

    const result = unwrapData(await runLoader());

    expect(getWorkspace).toHaveBeenCalledExactlyOnceWith({ workspaceId: WORKSPACE.id }, {});
    expect(listFolders).toHaveBeenCalledExactlyOnceWith({ workspaceId: WORKSPACE.id }, {});
    expect(listPages).toHaveBeenCalledExactlyOnceWith({}, {});
    expect(getUserInfo).toHaveBeenCalledExactlyOnceWith(undefined, {});
    expect(result.title).toBe("Bookmarks - Tiles");
    expect(result.data).toEqual({
      workspace: WORKSPACE,
      folders: FOLDERS,
      pages: PAGES,
      user: USER,
    });
  });
});
