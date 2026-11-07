import Router from "@/router/router";
import type { RouteImporter } from "@/router/router";

// Exclude test files
const routeModules = import.meta.glob(["@/routes/**/*.ts", "!**/__tests__/**", "!**/*.test.ts"], {
  import: "default",
});

function getPathFromModuleUrl(url: string) {
  const matches = url.match(/^\/src\/routes\/(.*)\.ts$/);
  if (!matches?.[1]) {
    return null;
  }
  const path = matches[1].replace(/\[(\w+)\]/g, ":$1");
  if (path === "index") {
    return "";
  }
  if (path.endsWith("/index")) {
    return path.slice(0, -6);
  }
  return path;
}

// Top-level modules named by a status code (e.g. `404.ts`) render error responses instead of paths.
const ERROR_ROUTE_PATTERN = /^[1-5]\d{2}$/;

export function getRouter() {
  const router = new Router();
  for (const [moduleUrl, importer] of Object.entries(routeModules)) {
    const path = getPathFromModuleUrl(moduleUrl);
    if (typeof path !== "string") {
      continue;
    }
    const route = {
      moduleUrl,
      import: importer as RouteImporter<unknown>,
    };
    if (ERROR_ROUTE_PATTERN.test(path)) {
      router.addErrorRoute(Number(path), route);
    } else {
      router.add(path, route);
    }
  }
  return router;
}
