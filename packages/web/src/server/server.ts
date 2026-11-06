import { getRouter } from "./routes";
import { renderToString } from "jsx/server";
import { renderHead } from "./head";
import globalMetadata from "@/routes/metadata";
import Body from "./Body";
import { internalError, notFound } from "@/router/responses";
import { resolveImport, getStylesheetsForRouteModule } from "./assets";
import { securityHeaders } from "./security";
import type { ModuleNode, ViteDevServer } from "vite";
import type { RouteMetadata, RouteMatch, APIRoute } from "@/router/router";

const router = getRouter();

function inspectModuleStylesheets(module: ModuleNode, stylesheets: string[], seen: Set<string>) {
  const id = module.id;
  if (!id || seen.has(id)) {
    return;
  }
  seen.add(id);
  if (module.url.endsWith(".css")) {
    stylesheets.push(module.url);
  }
  for (const importedModule of module.importedModules) {
    inspectModuleStylesheets(importedModule, stylesheets, seen);
  }
}

async function collectStylesheets(moduleUrl: string, viteDevServer?: ViteDevServer) {
  const stylesheets: string[] = [];
  const seen = new Set<string>();
  const module = await viteDevServer?.moduleGraph.getModuleByUrl(moduleUrl);
  if (!module) {
    return stylesheets;
  }
  inspectModuleStylesheets(module, stylesheets, seen);
  return stylesheets;
}

interface LinkResource {
  href: string;
  type: "script" | "style";
  crossorigin?: boolean;
}

function getLinks(resources: LinkResource[]) {
  return resources.map(({ href, type, crossorigin }) => {
    const crossoriginAttr = crossorigin ? "; crossorigin" : "";
    return `<${href}>; rel=preload; as=${type}${crossoriginAttr}`;
  });
}

function mergeRouteMetadata(...metadata: RouteMetadata[]) {
  const merged: RouteMetadata = {};
  for (const entry of metadata) {
    if (entry.links) {
      merged.links = (merged.links ?? []).concat(entry.links);
    }
    if (entry.scripts) {
      merged.scripts = (merged.scripts ?? []).concat(entry.scripts);
    }
    if (entry.styles) {
      merged.styles = (merged.styles ?? []).concat(entry.styles);
    }
  }
  return merged;
}

function getRequestHandler(method: string, routeConfig: APIRoute) {
  switch (method) {
    case "GET":
      return routeConfig.get;
    case "POST":
      return routeConfig.post;
    case "PUT":
      return routeConfig.put;
    case "PATCH":
      return routeConfig.patch;
    case "DELETE":
      return routeConfig.delete;
    default:
      return undefined;
  }
}

async function renderRoute(
  url: URL,
  request: Request,
  routeMatch: RouteMatch,
  viteDevServer?: ViteDevServer,
) {
  const method = request.method;
  const { route, parameters } = routeMatch;
  const routeConfig = await route.import();

  if (!("component" in routeConfig)) {
    try {
      const handler = getRequestHandler(method, routeConfig);
      if (!handler) {
        return notFound();
      }
      const response = await handler({
        url,
        headers: request.headers,
        parameters,
      });
      return response;
    } catch (error) {
      console.error("Route error:", error);
      return internalError();
    }
  }

  const { middleware, loader, component, metadata = {}, hydrate } = routeConfig;

  if (middleware) {
    try {
      const response = await middleware(request);
      if (response) {
        return response;
      }
    } catch (error) {
      console.error("Middleware error:", error);
      return internalError();
    }
  }

  const stylesheets = import.meta.env.PROD
    ? getStylesheetsForRouteModule(route.moduleUrl)
    : await collectStylesheets(route.moduleUrl, viteDevServer);

  const loaderResult = loader
    ? await loader({
        url,
        headers: request.headers,
        parameters,
      })
    : undefined;

  if (loaderResult instanceof Response) {
    return loaderResult;
  }

  const { headers = {}, bodyAttributes = {}, metadata: loaderMetadata, data } = loaderResult ?? {};

  const mergedMetadata = mergeRouteMetadata(globalMetadata, metadata, loaderMetadata ?? {});

  const resources: LinkResource[] = [
    ...stylesheets.map((href) => ({ href, type: "style" as const })),
    ...(mergedMetadata.scripts ?? []).map((s) => ({
      href: resolveImport(s.src),
      type: "script" as const,
      crossorigin: true,
    })),
  ];

  if (hydrate === "immediate") {
    resources.push({
      href: resolveImport("/src/server/hydrate.ts"),
      type: "script",
      crossorigin: true,
    });
  }

  const links = getLinks(resources);

  const body =
    '<!doctype html><html lang="en">' +
    renderHead({
      url,
      stylesheets,
      metadata: mergedMetadata,
      title: loaderResult?.title,
      description: loaderResult?.description,
      hydrate,
    }) +
    renderToString(
      Body({
        ...bodyAttributes,
        children: component(data),
        routeContext: hydrate
          ? { module: resolveImport(route.moduleUrl), params: parameters }
          : undefined,
      }),
    ) +
    "</html>";

  return new Response(body, {
    status: 200,
    headers: {
      "Content-Type": "text/html",
      Link: links.join(", "),
      ...securityHeaders,
      ...headers,
    },
  });
}

export default async function respond(request: Request, viteDevServer?: ViteDevServer) {
  const url = new URL(request.url);
  const route = router.match(url.pathname);

  if (!route) {
    return notFound();
  }

  try {
    const response = await renderRoute(url, request, route, viteDevServer);
    return response;
  } catch (error) {
    console.error(request.url, error);
    return internalError();
  }
}

export type Respond = typeof respond;
