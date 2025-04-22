import type { IncomingHttpHeaders } from "node:http";
import type { JSX } from "@/jsx/jsx";

export interface RequestProperties {
  path: string;
  headers: IncomingHttpHeaders;
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

export type RouteLoaderResult<T> = Promise<RouteData<T>>;

export type RouteLoader<T> = (
  request: RequestProperties,
) => RouteLoaderResult<T>;

export interface Route<T> {
  loader?: RouteLoader<T>;
  component: JSX.Component<T>;
  metadata?: RouteMetadata;
}

export type RouteImporter<T> = () => Promise<Route<T>>;

export interface RouteConfig {
  import: RouteImporter<unknown>;
  moduleUrl: string;
}

export interface RouteNode {
  route?: RouteConfig;
  wildcard?: RouteNode;
  children?: Map<string, RouteNode>;
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
      if (segment === "*") {
        if (!node.wildcard) {
          node.wildcard = {};
        }
        node = node.wildcard;
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

  match(path: string): RouteConfig | null {
    const segments = this.getPathSegments(path);

    if (segments.length === 0) {
      return this.root.route ?? null;
    }

    let route = this.root;

    for (const segment of segments) {
      const childRoute = route.children?.get(segment);
      if (childRoute) {
        route = childRoute;
      } else if (route.wildcard) {
        route = route.wildcard;
      } else {
        return null;
      }
    }

    return route.route ?? null;
  }
}
