import Router from "@/router/router";
import type { RouteImporter } from "@/router/router";

const routeModules = import.meta.glob("@/routes/**/*.tsx", {
  import: "default",
});

export function getRouter() {
  const router = new Router();
  for (const [moduleUrl, importer] of Object.entries(routeModules)) {
    const path = moduleUrl.match(/^\/src\/routes(.*)\.tsx$/)?.[1];
    if (path) {
      router.add(path, {
        moduleUrl,
        import: importer as RouteImporter<unknown>,
      });
    }
  }
  return router;
}
