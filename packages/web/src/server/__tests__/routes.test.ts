import { describe, expect, test } from "vitest";
import { getPathFromModuleUrl, getRouter } from "../routes";
import type { RouteNode } from "@/router/router";

function collectModuleUrls(node: RouteNode, urls: string[] = []) {
  if (node.route) {
    urls.push(node.route.moduleUrl);
  }
  if (node.dynamic) {
    collectModuleUrls(node.dynamic, urls);
  }
  for (const child of node.children?.values() ?? []) {
    collectModuleUrls(child, urls);
  }
  return urls;
}

describe("getPathFromModuleUrl", () => {
  test.each([
    ["/src/routes/index.ts", ""],
    ["/src/routes/sign-in/index.ts", "sign-in"],
    ["/src/routes/sign-in/google/callback.ts", "sign-in/google/callback"],
    ["/src/routes/pages/[id].ts", "pages/:id"],
    ["/src/routes/workspaces/[workspaceId]/index.ts", "workspaces/:workspaceId"],
    [
      "/src/routes/workspaces/[workspaceId]/folders/[folderId].ts",
      "workspaces/:workspaceId/folders/:folderId",
    ],
  ])("maps %s to %j", (url, path) => {
    expect(getPathFromModuleUrl(url)).toBe(path);
  });

  test.each([
    "/src/other/index.ts",
    "src/routes/index.ts",
    "/src/routes/index.tsx",
    "/src/routes/.ts",
  ])("returns null for %s", (url) => {
    expect(getPathFromModuleUrl(url)).toBeNull();
  });
});

describe("getRouter", () => {
  const router = getRouter();
  const moduleUrls = collectModuleUrls(router.root);

  test("registers route modules", () => {
    expect(moduleUrls).toContain("/src/routes/index.ts");
    expect(router.match("/")?.route.moduleUrl).toBe("/src/routes/index.ts");
    expect(router.match("/pages/123")).toEqual({
      route: expect.objectContaining({ moduleUrl: "/src/routes/pages/[id].ts" }),
      parameters: { id: "123" },
    });
    expect(router.match("/workspaces/abc/folders/def")).toEqual({
      route: expect.objectContaining({
        moduleUrl: "/src/routes/workspaces/[workspaceId]/folders/[folderId].ts",
      }),
      parameters: { workspaceId: "abc", folderId: "def" },
    });
  });

  test("imports the route module lazily", async () => {
    const match = router.match("/sign-in");
    const module = await match?.route.import();
    expect(module).toHaveProperty("component");
  });

  test("does not register test files", () => {
    expect(moduleUrls.some((url) => url.includes("__tests__"))).toBe(false);
    expect(moduleUrls.some((url) => url.endsWith(".test.ts"))).toBe(false);
    expect(router.match("/pages/__tests__/loader.test")).toBeNull();
    expect(router.match("/sign-in/__tests__/index.test")).toBeNull();
  });

  test("skips modules outside the routes directory", () => {
    const importer = () => Promise.resolve({});
    const custom = getRouter({
      "/src/routes/about.ts": importer,
      "/src/other/contact.ts": importer,
    });
    expect(collectModuleUrls(custom.root)).toEqual(["/src/routes/about.ts"]);
    expect(custom.match("/contact")).toBeNull();
  });
});
