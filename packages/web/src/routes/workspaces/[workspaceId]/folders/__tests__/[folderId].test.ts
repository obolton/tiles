import { beforeEach, describe, expect, test, vi } from "vitest";
import route from "../[folderId]";
import client from "@/api/client";
import { USER } from "@/test/fixtures/User";
import { WORKSPACE } from "@/test/fixtures/Workspace";
import { requestProperties, stubSignedIn, unwrapData, unwrapResponse } from "@/test/routes";

vi.mock("@/api/client", () => import("@/test/mocks/apiClient"));

const FOLDER = { id: "folder-id", name: "Designs" };
const FOLDERS = { folders: [FOLDER], nextCursor: null };
const PAGES = { pages: [], nextCursor: null };

const getWorkspace = vi.mocked(client.workspaces.get.query);
const getFolder = vi.mocked(client.folders.get.query);
const listFolders = vi.mocked(client.folders.list.query);
const listPages = vi.mocked(client.folders.listPages.query);
const getUserInfo = vi.mocked(client.users.getUserInfo.query);

function runLoader(parameters: Record<string, string>) {
  return route.loader(
    requestProperties({
      url: `http://localhost/workspaces/${WORKSPACE.id}/folders/${FOLDER.id}`,
      parameters,
    }),
  );
}

describe("workspaces/[workspaceId]/folders/[folderId] loader", () => {
  beforeEach(() => {
    getWorkspace.mockResolvedValue(WORKSPACE);
    getFolder.mockResolvedValue(FOLDER);
    listFolders.mockResolvedValue(FOLDERS);
    listPages.mockResolvedValue(PAGES);
    getUserInfo.mockResolvedValue(USER);
  });

  test("returns not found without a workspace or folder id", async () => {
    expect(unwrapResponse(await runLoader({ folderId: FOLDER.id })).status).toBe(404);
    expect(unwrapResponse(await runLoader({ workspaceId: WORKSPACE.id })).status).toBe(404);
    expect(getFolder).not.toHaveBeenCalled();
  });

  test("returns forbidden on the client when signed out", async () => {
    stubSignedIn(false);
    const response = unwrapResponse(
      await runLoader({ workspaceId: WORKSPACE.id, folderId: FOLDER.id }),
    );
    expect(response.status).toBe(403);
    expect(getFolder).not.toHaveBeenCalled();
  });

  test("loads the folder and its pages", async () => {
    stubSignedIn(true);

    const result = unwrapData(await runLoader({ workspaceId: WORKSPACE.id, folderId: FOLDER.id }));

    const folderInput = { workspaceId: WORKSPACE.id, id: FOLDER.id };
    expect(getWorkspace).toHaveBeenCalledExactlyOnceWith({ workspaceId: WORKSPACE.id }, {});
    expect(getFolder).toHaveBeenCalledExactlyOnceWith(folderInput, {});
    expect(listFolders).toHaveBeenCalledExactlyOnceWith({ workspaceId: WORKSPACE.id }, {});
    expect(listPages).toHaveBeenCalledExactlyOnceWith(folderInput, {});
    expect(getUserInfo).toHaveBeenCalledExactlyOnceWith(undefined, {});
    expect(result.title).toBe("Designs - Tiles");
    expect(result.data).toEqual({
      workspace: WORKSPACE,
      id: FOLDER.id,
      name: FOLDER.name,
      folders: FOLDERS,
      pages: PAGES,
      user: USER,
    });
  });
});
