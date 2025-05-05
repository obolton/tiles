import { getRouter } from "./routes";
import { escapeUTF8 } from "entities";
import { renderToString } from "@/jsx/server";
import globalMetadata from "@/routes/metadata";
import Body from "./Body";
import type { IncomingMessage, ServerResponse } from "node:http";
import type { ModuleNode, ViteDevServer } from "vite";
import type {
  RouteData,
  RouteMetadata,
  RouteMiddlewareResult,
  RouteMatch,
  APIRoute,
  APIRequestResult,
} from "@/router/router";

const router = getRouter();

function notFound(response: ServerResponse) {
  if (!response.headersSent) {
    response.writeHead(404);
    response.end("Not Found");
  } else {
    response.end();
  }
}

function internalError(response: ServerResponse) {
  if (!response.headersSent) {
    response.writeHead(500);
    response.end("Internal Error");
  } else {
    response.end();
  }
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

function getEarlyHintsLinks(stylesheets: string[], metadata: RouteMetadata) {
  const hints: string[] = [];

  hints.push("</src/server/hydrate>; rel=preload; as=script");

  for (const stylesheet of stylesheets) {
    hints.push("<" + stylesheet + ">; rel=preload; as=style");
  }

  if (metadata.scripts) {
    for (const script of metadata.scripts) {
      hints.push("<" + script.src + ">; rel=preload; as=script");
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
        '<script type="module" src="' + escapeUTF8(script.src) + '"></script>';
    }
  }

  chunk += '<script type="module" src="/src/server/hydrate"></script>';
  chunk += '<script type="module" src="/@vite/client"></script>';
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

function handleAPIRequestResult(
  result: APIRequestResult,
  response: ServerResponse,
) {
  if ("location" in result) {
    response.writeHead(result.statusCode, {
      location: result.location,
    });
    response.end();
  }
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
  request: IncomingMessage,
  response: ServerResponse,
  routeMatch: RouteMatch,
  viteDevServer: ViteDevServer,
) {
  const method = request.method ?? "GET";
  const { route, parameters } = routeMatch;
  const routeConfig = await route.import();

  if (!("component" in routeConfig)) {
    try {
      const handler = getRequestHandler(method, routeConfig);
      if (handler) {
        const routeResult = await handler(
          {
            url,
            headers: request.headers,
            parameters,
          },
          response,
        );
        if (routeResult) {
          await handleAPIRequestResult(routeResult, response);
        }
      } else {
        notFound(response);
      }
    } catch (error) {
      console.error("Route error:", error);
      internalError(response);
    }
    return;
  }

  const { middleware, loader, component, metadata = {} } = routeConfig;

  if (middleware) {
    try {
      const middlewareResult = middleware(request);
      if (middlewareResult) {
        handleMiddlewareResult(middlewareResult, response);
        return;
      }
    } catch (error) {
      console.error("Middleware error:", error);
      internalError(response);
      return;
    }
  }

  const mergedMetadata = mergeRouteMetadata(globalMetadata, metadata);

  const stylesheets = await collectStylesheets(route.moduleUrl, viteDevServer);

  const earlyHintLinks = getEarlyHintsLinks(stylesheets, mergedMetadata);
  response.writeEarlyHints({ link: earlyHintLinks });

  const data = loader
    ? await loader({
        url,
        headers: request.headers,
        parameters,
      })
    : undefined;

  response.writeHead(200);
  response.write(getPageStartChunk(stylesheets, mergedMetadata, data));

  const body = renderToString(
    Body({
      ...data?.bodyAttributes,
      children: component(data?.data),
      hydrate:
        typeof data?.data !== "undefined"
          ? { module: route.moduleUrl, data: data.data }
          : undefined,
    }),
  );
  response.write(body + "</html>");
  response.end();
}

export default async function respond(
  request: IncomingMessage,
  response: ServerResponse,
  viteDevServer: ViteDevServer,
) {
  const url = new URL(request.url ?? "", import.meta.env.PUBLIC_WEB_BASE_URL);
  const route = router.match(url.pathname);

  if (!route) {
    notFound(response);
    return;
  }

  try {
    await renderRoute(url, request, response, route, viteDevServer);
  } catch (error) {
    response.end();
    console.error(request.url, error);
  }
}

export type Respond = typeof respond;
