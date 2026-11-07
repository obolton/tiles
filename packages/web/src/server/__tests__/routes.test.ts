import { describe, expect, test } from "vitest";
import { getRouter } from "../routes";
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

describe("getRouter", () => {
  const router = getRouter();
  const moduleUrls = collectModuleUrls(router.root);

  test("registers route modules", () => {
    expect(moduleUrls).toContain("/src/routes/index.ts");
    expect(router.match("/pages/123")?.route.moduleUrl).toBe("/src/routes/pages/[id].ts");
  });

  test("registers status code modules as error routes rather than paths", () => {
    expect(router.getErrorRoute(403)?.moduleUrl).toBe("/src/routes/403.ts");
    expect(router.getErrorRoute(404)?.moduleUrl).toBe("/src/routes/404.ts");
    expect(router.getErrorRoute(500)?.moduleUrl).toBe("/src/routes/500.ts");
    expect(moduleUrls).not.toContain("/src/routes/404.ts");
    expect(router.match("/404")).toBeNull();
  });

  test("does not register test files as routes", () => {
    expect(moduleUrls.some((url) => url.includes("__tests__"))).toBe(false);
    expect(moduleUrls.some((url) => url.endsWith(".test.ts"))).toBe(false);
    expect(router.match("/pages/__tests__/loader.test")).toBeNull();
  });
});
