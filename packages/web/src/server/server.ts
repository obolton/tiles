import { getRouter } from "./routes";
import { escapeUTF8 } from "entities";
import { renderToString } from "@/jsx/server";
import globalMetadata from "@/routes/metadata";
import type { IncomingMessage, ServerResponse } from "node:http";
import type { ModuleNode, ViteDevServer } from "vite";
import type {
  RouteConfig,
  RouteData,
  RouteMetadata,
  RouteMiddlewareResult,
} from "@/router/router";

const router = getRouter();

function notFound(response: ServerResponse) {
  response.writeHead(404);
  response.end("Not Found");
}

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
  viteDevServer: ViteDevServer,
) {
  const stylesheets: string[] = [];
  const seen = new Set<string>();
  const module = await viteDevServer.moduleGraph.getModuleByUrl(moduleUrl);
  if (!module) {
    return stylesheets;
  }
  inspectModuleStylesheets(module, stylesheets, seen);
  return stylesheets;
}

async function getEarlyHeadChunk(
  routeConfig: RouteConfig,
  metadata: RouteMetadata,
  viteDevServer: ViteDevServer,
) {
  const stylesheets = await collectStylesheets(
    routeConfig.moduleUrl,
    viteDevServer,
  );

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
        '<script type="module" src="' + escapeUTF8(script.src) + '"></script>';
    }
  }

  chunk += '<script type="module" src="/src/server/hydrate"></script>';
  chunk += '<script type="module" src="/@vite/client"></script>';
  return chunk;
}

function getLateHeadChunk(data?: RouteData) {
  let chunk = "";
  if (typeof data?.title === "string") {
    chunk += "<title>" + escapeUTF8(data.title) + "</title>";
  }
  chunk += "</head><body>";
  return chunk;
}

function getPageEndChunk(routeConfig: RouteConfig, data?: RouteData) {
  let chunk = "";
  if (typeof data?.data !== "undefined") {
    chunk +=
      '<script id="page-data" type="application/json">' +
      JSON.stringify({ module: routeConfig.moduleUrl, data: data.data }) +
      "</script>";
  }
  chunk += "</body></html>";
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

function handleMiddlewareResult(
  result: RouteMiddlewareResult,
  response: ServerResponse,
) {
  if ("location" in result) {
    response.writeHead(result.statusCode, {
      location: result.location,
    });
    response.end();
  }
}

async function renderRoute(
  request: IncomingMessage,
  response: ServerResponse,
  routeConfig: RouteConfig,
  viteDevServer: ViteDevServer,
) {
  const {
    middleware,
    loader,
    component,
    metadata = {},
  } = await routeConfig.import();

  if (middleware) {
    const middlewareResult = middleware(request);
    if (middlewareResult) {
      handleMiddlewareResult(middlewareResult, response);
      return;
    }
  }

  const mergedMetadata = mergeRouteMetadata(globalMetadata, metadata);

  response.writeHead(200);
  response.write(
    await getEarlyHeadChunk(routeConfig, mergedMetadata, viteDevServer),
  );

  const data = loader
    ? await loader({
        path: request.url ?? "",
        headers: request.headers,
      })
    : undefined;

  response.write(getLateHeadChunk(data));

  const body = renderToString(component(data?.data));

  response.write(body);
  response.write(getPageEndChunk(routeConfig, data));
  response.end();
}

export default async function respond(
  request: IncomingMessage,
  response: ServerResponse,
  viteDevServer: ViteDevServer,
) {
  const route = router.match(request.url ?? "/");

  if (!route) {
    notFound(response);
    return;
  }

  renderRoute(request, response, route, viteDevServer);
}

export type Respond = typeof respond;
