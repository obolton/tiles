import type { RouteParameters } from "@/router/router";

interface RouteContext {
  module: string;
  params: RouteParameters;
}

function getRouteContext(): RouteContext {
  const element = document.getElementById("route-context");
  if (!element?.textContent) {
    throw new Error("Hydration error: route context not found");
  }
  return JSON.parse(element.textContent);
}

export async function hydrateRoute(): Promise<void> {
  const { module: routeModule, params: parameters } = getRouteContext();

  const [{ hydrate }, { default: route }] = await Promise.all([
    import("@/jsx/dom"),
    import(/* @vite-ignore */ routeModule),
  ]);

  const { loader, component } = route;

  let data: unknown;

  if (loader) {
    const result = await loader({
      url: new URL(window.location.href),
      headers: new Headers(),
      parameters,
    });

    if (result instanceof Response) {
      const location = result.headers.get("Location");
      if (location) {
        window.location.href = location;
        return;
      }
      throw new Error(`Loader returned ${result.status}`);
    }

    data = result?.data;
  }

  hydrate(component(data), document.body);
}
