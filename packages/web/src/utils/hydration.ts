import type { RouteParameters } from "@/router/router";

interface RouteContext {
  module: string;
  params: RouteParameters;
}

export function getRouteContext(): RouteContext {
  const element = document.getElementById("route-context");
  if (!element?.textContent) {
    throw new Error("Hydration error: route context not found");
  }
  return JSON.parse(element.textContent);
}

interface HydrateResult {
  data: unknown;
  parameters: RouteParameters;
}

export async function hydrateRoute(): Promise<HydrateResult> {
  const { module: routeModule, params: parameters } = getRouteContext();

  const [{ hydrate }, { default: route }] = await Promise.all([
    import("@/jsx/dom"),
    import(/* @vite-ignore */ routeModule),
  ]);

  const { loader, component, beforeHydrate, afterHydrate } = route;

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
        return { data: undefined, parameters };
      }
      throw new Error(`Loader returned ${result.status}`);
    }

    data = result?.data;
  }

  const context = { parameters, data };
  beforeHydrate?.(context);
  hydrate(component(data), document.body);
  afterHydrate?.(context);

  return context;
}
