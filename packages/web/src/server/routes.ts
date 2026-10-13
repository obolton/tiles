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

export function getRouter() {
  const router = new Router();
  for (const [moduleUrl, importer] of Object.entries(routeModules)) {
    const path = getPathFromModuleUrl(moduleUrl);
    if (typeof path === "string") {
      router.add(path, {
        moduleUrl,
        import: importer as RouteImporter<unknown>,
      });
    }
  }
  return router;
}
