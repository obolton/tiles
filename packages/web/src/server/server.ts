import { getRouter } from "./routes";
import { escapeUTF8 } from "entities";
import { renderToString } from "@/jsx/server";
import type { IncomingMessage } from "node:http";
import type { ModuleNode, ViteDevServer } from "vite";
import type { RouteConfig } from "@/router/router";

const router = getRouter();

interface HTMLResponse {
  statusCode?: number;
  html: {
    head?: string;
    body: string;
  };
}

interface TextResponse {
  statusCode?: number;
  text: string;
}

type Response = HTMLResponse | TextResponse;

function notFound(): Response {
  return {
    statusCode: 404,
    text: "Not Found",
  };
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

async function renderRoute(request: IncomingMessage, routeConfig: RouteConfig) {
  const { title, component } = await routeConfig.loader();
  const body = renderToString(
    await component({
      path: request.url ?? "",
      headers: request.headers,
    }),
  );
  return { title, body };
}

interface CreateHeadOptions {
  title?: string;
  stylesheets?: string[];
}

function createHead({ title, stylesheets }: CreateHeadOptions) {
  let head = "";
  if (title) {
    head += "<title>" + escapeUTF8(title) + "</title>";
  }
  if (stylesheets) {
    for (const stylesheet of stylesheets) {
      head += '<link rel="stylesheet" href="' + escapeUTF8(stylesheet) + '">';
    }
  }
  return head;
}

async function serveRoute(
  request: IncomingMessage,
  routeConfig: RouteConfig,
  viteDevServer: ViteDevServer,
): Promise<Response> {
  const { title, body } = await renderRoute(request, routeConfig);
  const stylesheets = await collectStylesheets(
    routeConfig.moduleUrl,
    viteDevServer,
  );

  return {
    statusCode: 200,
    html: {
      head: createHead({
        title,
        stylesheets,
      }),
      body,
    },
  };
}

export default async function respond(
  request: IncomingMessage,
  viteDevServer: ViteDevServer,
): Promise<Response> {
  const route = router.match(request.url ?? "/");

  if (!route) {
    return notFound();
  }
  return serveRoute(request, route, viteDevServer);
}

export type Respond = typeof respond;
