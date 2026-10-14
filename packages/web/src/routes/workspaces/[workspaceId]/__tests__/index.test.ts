import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import route from "../index";
import client from "@/api/client";
import { initRoute } from "@/routes/init";
import { USER } from "@/test/fixtures/User";
import { WORKSPACE } from "@/test/fixtures/Workspace";
import {
  requestProperties,
  SESSION_COOKIE,
  SESSION_ID,
  stubSignedIn,
  unwrapData,
  unwrapResponse,
} from "@/test/routes";

vi.mock("@/api/client", () => import("@/test/mocks/apiClient"));
vi.mock("@/routes/init", () => ({ initRoute: vi.fn() }));

const FOLDERS = { folders: [{ id: "folder-id", name: "Folder" }], nextCursor: null };
const PAGES = { pages: [], nextCursor: null };
const SESSION_OPTIONS = { context: { sessionId: SESSION_ID } };

const getWorkspace = vi.mocked(client.workspaces.get.query);
const listFolders = vi.mocked(client.folders.list.query);
const listPages = vi.mocked(client.pages.list.query);
const getUserInfo = vi.mocked(client.users.getUserInfo.query);

function runLoader(parameters = { workspaceId: WORKSPACE.id }, cookie?: string) {
  return route.loader(
    requestProperties({ url: `http://localhost/workspaces/${WORKSPACE.id}`, cookie, parameters }),
  );
}

describe("workspaces/[workspaceId]", () => {
  beforeEach(() => {
    getWorkspace.mockResolvedValue(WORKSPACE);
    listFolders.mockResolvedValue(FOLDERS);
    listPages.mockResolvedValue(PAGES);
    getUserInfo.mockResolvedValue(USER);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  describe("loader", () => {
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

    test("loads the workspace, folders, pages and user in parallel", async () => {
      stubSignedIn(true);

      const result = unwrapData(await runLoader());

      expect(getWorkspace).toHaveBeenCalledExactlyOnceWith({ workspaceId: WORKSPACE.id }, {});
      expect(listFolders).toHaveBeenCalledExactlyOnceWith({ workspaceId: WORKSPACE.id }, {});
      expect(listPages).toHaveBeenCalledExactlyOnceWith({ workspaceId: WORKSPACE.id }, {});
      expect(getUserInfo).toHaveBeenCalledExactlyOnceWith(undefined, {});
      expect(result.title).toBe("Your pages - Tiles");
      expect(result.data).toEqual({
        workspace: WORKSPACE,
        folders: FOLDERS,
        pages: PAGES,
        user: USER,
      });
    });

    test("forwards the session to the API during SSR", async () => {
      vi.stubEnv("SSR", true);
      stubSignedIn(false);

      const result = unwrapData(await runLoader({ workspaceId: WORKSPACE.id }, SESSION_COOKIE));

      expect(result.data.workspace).toEqual(WORKSPACE);
      expect(getWorkspace).toHaveBeenCalledWith({ workspaceId: WORKSPACE.id }, SESSION_OPTIONS);
      expect(listFolders).toHaveBeenCalledWith({ workspaceId: WORKSPACE.id }, SESSION_OPTIONS);
      expect(listPages).toHaveBeenCalledWith({ workspaceId: WORKSPACE.id }, SESSION_OPTIONS);
      expect(getUserInfo).toHaveBeenCalledWith(undefined, SESSION_OPTIONS);
    });
  });

  describe("middleware", () => {
    test("is omitted from the client module", () => {
      expect(route.middleware).toBeUndefined();
    });

    test("requires authentication on the server", async () => {
      vi.resetModules();
      vi.stubEnv("SSR", true);
      const { default: serverRoute } = await import("../index");

      const response = serverRoute.middleware?.(
        new Request(`http://localhost/workspaces/${WORKSPACE.id}`),
      );

      expect(response?.status).toBe(302);
      expect(response?.headers.get("Location")).toBe("/sign-in");
    });
  });

  test("initializes the route with the loaded user before hydrating", () => {
    route.beforeHydrate({
      parameters: { workspaceId: WORKSPACE.id },
      data: { workspace: WORKSPACE, folders: FOLDERS, pages: PAGES, user: USER },
    });
    expect(initRoute).toHaveBeenCalledExactlyOnceWith(WORKSPACE.id, USER);
  });
});
