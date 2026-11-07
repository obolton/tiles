import { getRouter } from "./routes";
import { renderToString } from "jsx/server";
import { renderHead } from "./head";
import globalMetadata from "@/routes/metadata";
import Body from "./Body";
import { HttpError, InternalServerError, NotFoundError } from "@/router/errors";
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
  error?: HttpError,
) {
  const method = request.method;
  const { route, parameters } = routeMatch;
  const routeConfig = await route.import();
  const requestProperties = { url, headers: request.headers, parameters, error };

  if (!("component" in routeConfig)) {
    const handler = getRequestHandler(method, routeConfig);
    if (!handler) {
      throw new NotFoundError();
    }
    return handler(requestProperties);
  }

  const { middleware, loader, component, metadata = {}, hydrate } = routeConfig;

  if (middleware) {
    const response = await middleware(request);
    if (response) {
      return response;
    }
  }

  const stylesheets = import.meta.env.PROD
    ? getStylesheetsForRouteModule(route.moduleUrl)
    : await collectStylesheets(route.moduleUrl, viteDevServer);

  const loaderResult = loader ? await loader(requestProperties) : undefined;

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

  const responseHeaders = new Headers(error?.headers);
  responseHeaders.set("Content-Type", "text/html");
  responseHeaders.set("Link", links.join(", "));
  for (const [name, value] of Object.entries({ ...securityHeaders, ...headers })) {
    responseHeaders.set(name, value);
  }

  return new Response(body, {
    status: error?.status ?? 200,
    statusText: error?.message,
    headers: responseHeaders,
  });
}

async function renderError(
  url: URL,
  request: Request,
  error: unknown,
  viteDevServer?: ViteDevServer,
) {
  const httpError = error instanceof HttpError ? error : new InternalServerError({ cause: error });

  if (httpError.status >= 500) {
    const cause = httpError.cause ?? httpError;
    if (cause instanceof Error) {
      viteDevServer?.ssrFixStacktrace(cause);
    }
    console.error(request.url, cause);
  }

  const route = router.getErrorRoute(httpError.status);
  if (route) {
    try {
      return await renderRoute(url, request, { route, parameters: {} }, viteDevServer, httpError);
    } catch (renderingError) {
      console.error(`Failed to render the ${httpError.status} page:`, renderingError);
    }
  }

  return new Response(httpError.message, {
    status: httpError.status,
    statusText: httpError.message,
    headers: httpError.headers,
  });
}

export default async function respond(request: Request, viteDevServer?: ViteDevServer) {
  const url = new URL(request.url);

  try {
    const routeMatch = router.match(url.pathname);
    if (!routeMatch) {
      throw new NotFoundError();
    }
    return await renderRoute(url, request, routeMatch, viteDevServer);
  } catch (error) {
    return renderError(url, request, error, viteDevServer);
  }
}

export type Respond = typeof respond;
