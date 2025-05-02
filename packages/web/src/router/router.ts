import type { IncomingMessage, IncomingHttpHeaders } from "node:http";
import type { JSX } from "@/jsx/jsx";

export interface RequestProperties {
  url: URL;
  headers: IncomingHttpHeaders;
  parameters: RouteParameters;
}

export interface Link {
  rel: string;
  href: string;
}

export interface Script {
  src: string;
}

export interface RouteMetadata {
  links?: Link[];
  scripts?: Script[];
}

export interface RouteData<T = unknown> {
  title?: string;
  data: T;
}

export type RedirectStatusCode = 301 | 302 | 307 | 308;

export interface Redirect {
  statusCode: RedirectStatusCode;
  location: string;
}

export type RouteMiddlewareResult = Redirect;

export type RouteMiddleware = (
  request: IncomingMessage,
) => RouteMiddlewareResult | undefined;

export type RouteLoaderResult<T> = Promise<RouteData<T>>;

export type RouteLoader<T> = (
  request: RequestProperties,
) => RouteLoaderResult<T>;

export interface Route<T> {
  middleware?: RouteMiddleware;
  loader?: RouteLoader<T>;
  component: JSX.Component<T>;
  metadata?: RouteMetadata;
}

export type RouteImporter<T> = () => Promise<Route<T>>;

export interface RouteConfig {
  import: RouteImporter<unknown>;
  moduleUrl: string;
}

export type RouteParameters = Record<string, string>;

export interface RouteMatch {
  route: RouteConfig;
  parameters: RouteParameters;
}

export interface RouteNode {
  route?: RouteConfig;
  parameter?: string;
  dynamic?: RouteNode;
  children?: Map<string, RouteNode>;
}

export function redirect(
  location: string,
  statusCode: RedirectStatusCode = 301,
): Redirect {
  return { statusCode, location };
}

export default class Router {
  readonly root: RouteNode = {};

  getPathSegments(path: string) {
    return path.split("/").filter((segment) => segment.length > 0);
  }

  add(path: string, route: RouteConfig) {
    const segments = this.getPathSegments(path);

    let node = this.root;

    for (const segment of segments) {
      if (segment.startsWith(":")) {
        const parameter = segment.slice(1);

        if (parameter.length === 0) {
          throw new Error(`Invalid path: ${path}`);
        }

        if (!node.dynamic) {
          node.dynamic = {
            parameter,
          };
        }
        node = node.dynamic;
      } else {
        if (!node.children) {
          node.children = new Map();
          node.children.set(segment, {});
        } else if (!node.children.has(segment)) {
          node.children.set(segment, {});
        }
        node = node.children.get(segment)!;
      }
    }
    node.route = route;
  }

  match(path: string): RouteMatch | null {
    const segments = this.getPathSegments(path);
    const parameters: RouteParameters = {};

    if (segments.length === 0) {
      return this.root.route ? { route: this.root.route, parameters } : null;
    }

    let node = this.root;

    for (const segment of segments) {
      const staticRoute = node.children?.get(segment);
      if (staticRoute) {
        node = staticRoute;
      } else if (node.dynamic) {
        node = node.dynamic;

        if (node.parameter) {
          parameters[node.parameter] = segment;
        }
      } else {
        return null;
      }
    }

    return node.route ? { route: node.route, parameters } : null;
  }
}
