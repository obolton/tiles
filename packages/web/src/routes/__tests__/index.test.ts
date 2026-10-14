import { afterEach, describe, expect, test, vi } from "vitest";
import * as Y from "yjs";
import { bytesToBase64 } from "doc/encoding";
import client from "@/api/client";
import { indexRoute } from "../index";
import { PAGE } from "@/test/fixtures/Page";
import { USER } from "@/test/fixtures/User";
import { createDoc } from "@/test/fixtures/doc";
import { CACHE_CONTROL_VALUE } from "@/constants/cdn";
import { SITE_DESCRIPTION } from "@/constants/site";
import { SESSION_COOKIE, SESSION_ID, unwrapData, unwrapResponse } from "@/test/routes";

vi.mock("@/api/client", () => import("@/test/mocks/apiClient"));

const getUserInfo = vi.mocked(client.users.getUserInfo.query);

function request(cookie?: string) {
  return new Request("http://localhost/", { headers: cookie ? { cookie } : {} });
}

describe("indexRoute", () => {
  test("lets anonymous requests fall through", async () => {
    await expect(indexRoute(request())).resolves.toBeUndefined();
    expect(getUserInfo).not.toHaveBeenCalled();
  });

  test("redirects a signed-in user to their first workspace", async () => {
    getUserInfo.mockResolvedValue(USER);

    const response = await indexRoute(request(SESSION_COOKIE));

    expect(getUserInfo).toHaveBeenCalledExactlyOnceWith(undefined, {
      context: { sessionId: SESSION_ID },
    });
    expect(response?.status).toBe(302);
    expect(response?.headers.get("Location")).toBe("/workspaces/workspace-id");
  });

  test("falls through when the user has no workspaces", async () => {
    getUserInfo.mockResolvedValue({ ...USER, workspaces: [] });
    await expect(indexRoute(request(SESSION_COOKIE))).resolves.toBeUndefined();
  });

  test("falls through when the user lookup fails", async () => {
    getUserInfo.mockRejectedValue(new Error("Unavailable"));
    await expect(indexRoute(request(SESSION_COOKIE))).resolves.toBeUndefined();
  });
});

// The loader is only attached to the route during SSR and reads PUBLIC_PAGE_ID at import time,
// so the module is reloaded with the environment stubbed. Import the (mocked) client first:
// importing it concurrently with the route can hand the route the real client.
async function loadServerRoute(pageId: string) {
  vi.resetModules();
  vi.stubEnv("SSR", true);
  vi.stubEnv("PUBLIC_PAGE_ID", pageId);
  const { default: freshClient } = await import("@/api/client");
  const { default: route } = await import("../index");
  const getPage = vi.mocked(freshClient.pages.getById.query);
  if (!route.loader) {
    throw new Error("Expected the server route to have a loader");
  }
  return { loader: route.loader, getPage };
}

describe("loader", () => {
  const DOCUMENT = bytesToBase64(Y.encodeStateAsUpdate(createDoc([])));

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  test("is omitted from the client module along with the middleware", async () => {
    vi.resetModules();
    const { default: route } = await import("../index");
    expect(route.loader).toBeUndefined();
    expect(route.middleware).toBeUndefined();
  });

  test("returns not found without a public page id", async () => {
    const { loader, getPage } = await loadServerRoute("");

    const response = unwrapResponse(await loader());

    expect(response.status).toBe(404);
    expect(getPage).not.toHaveBeenCalled();
  });

  test("returns not found when the public page is missing", async () => {
    const { loader, getPage } = await loadServerRoute(PAGE.id);
    getPage.mockResolvedValue(null);

    const response = unwrapResponse(await loader());

    expect(getPage).toHaveBeenCalledExactlyOnceWith({ id: PAGE.id });
    expect(response.status).toBe(404);
  });

  test("renders the public page with a cacheable response", async () => {
    const { loader, getPage } = await loadServerRoute(PAGE.id);
    getPage.mockResolvedValue({ ...PAGE, document: DOCUMENT });

    const result = unwrapData(await loader());

    expect(result.headers).toEqual({ "Cache-Control": CACHE_CONTROL_VALUE });
    expect(result.title).toBe(PAGE.title);
    expect(result.description).toBe(SITE_DESCRIPTION);
    expect(result.bodyAttributes?.["data-page-id"]).toBe(PAGE.id);
    expect(result.data.page).toEqual({ ...PAGE, document: DOCUMENT });
    expect(result.data.doc).toBeInstanceOf(Y.Doc);
    expect(result.metadata?.styles).toHaveLength(1);
  });
});
