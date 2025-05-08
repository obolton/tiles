import { getRouter } from "./routes";
import { escapeUTF8 } from "entities";
import { renderToString } from "@/jsx/server";
import globalMetadata from "@/routes/metadata";
import Body from "./Body";
import { internalError, notFound } from "@/router/router";
import { resolveImport, getStylesheetsForRouteModule } from "./assets";
import type { ModuleNode, ViteDevServer } from "vite";
import type {
  RouteData,
  RouteMetadata,
  RouteMatch,
  APIRoute,
} from "@/router/router";

const router = getRouter();

function inspectModuleStylesheets(
  module: ModuleNode,
  stylesheets: string[],
  seen: Set<string>,
) {
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

async function collectStylesheets(
  moduleUrl: string,
  viteDevServer?: ViteDevServer,
) {
  const stylesheets: string[] = [];
  const seen = new Set<string>();
  const module = await viteDevServer?.moduleGraph.getModuleByUrl(moduleUrl);
  if (!module) {
    return stylesheets;
  }
  inspectModuleStylesheets(module, stylesheets, seen);
  return stylesheets;
}

function getLinks(stylesheets: string[], metadata: RouteMetadata) {
  const hints: string[] = [];

  hints.push(
    "<" + resolveImport("/src/server/hydrate.ts") + ">; rel=preload; as=script",
  );

  for (const stylesheet of stylesheets) {
    hints.push("<" + stylesheet + ">; rel=preload; as=style");
  }

  if (metadata.scripts) {
    for (const script of metadata.scripts) {
      hints.push("<" + resolveImport(script.src) + ">; rel=preload; as=script");
    }
  }

  return hints;
}

function getPageStartChunk(
  stylesheets: string[],
  metadata: RouteMetadata,
  data?: RouteData,
) {
  let chunk = '<!doctype html><html><head><meta charset="utf-8">';

  for (const stylesheet of stylesheets) {
    chunk += '<link rel="stylesheet" href="' + escapeUTF8(stylesheet) + '">';
  }

  if (metadata.links) {
    for (const link of metadata.links) {
      chunk +=
        '<link rel="' +
        escapeUTF8(link.rel) +
        '" href="' +
        escapeUTF8(link.href) +
        '">';
    }
  }

  if (metadata.scripts) {
    for (const script of metadata.scripts) {
      chunk +=
        '<script type="module" src="' +
        escapeUTF8(resolveImport(script.src)) +
        '"></script>';
    }
  }

  chunk +=
    '<script type="module" src="' +
    resolveImport("/src/server/hydrate.ts") +
    '"></script>';

  if (import.meta.env.DEV) {
    chunk += '<script type="module" src="/@vite/client"></script>';
  }

  if (typeof data?.title === "string") {
    chunk += "<title>" + escapeUTF8(data.title) + "</title>";
  }
  chunk += "</head>";
  return chunk;
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
  const method = request.method ?? "GET";
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

  const { middleware, loader, component, metadata = {} } = routeConfig;

  if (middleware) {
    try {
      const response = middleware(request);
      if (response) {
        return response;
      }
    } catch (error) {
      console.error("Middleware error:", error);
      return internalError();
    }
  }

  const mergedMetadata = mergeRouteMetadata(globalMetadata, metadata);

  const stylesheets = import.meta.env.PROD
    ? getStylesheetsForRouteModule(route.moduleUrl)
    : await collectStylesheets(route.moduleUrl, viteDevServer);

  const links = getLinks(stylesheets, mergedMetadata);

  const data = loader
    ? await loader({
        url,
        headers: request.headers,
        parameters,
      })
    : undefined;

  const body =
    getPageStartChunk(stylesheets, mergedMetadata, data) +
    renderToString(
      Body({
        ...data?.bodyAttributes,
        children: component(data?.data),
        hydrate:
          typeof data?.data !== "undefined"
            ? { module: resolveImport(route.moduleUrl), data: data.data }
            : undefined,
      }),
    ) +
    "</html>";

  return new Response(body, {
    status: 200,
    headers: {
      "Content-Type": "text/html",
      Link: links.join(", "),
    },
  });
}

export default async function respond(
  request: Request,
  viteDevServer?: ViteDevServer,
) {
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
