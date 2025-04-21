import type { IncomingHttpHeaders } from "node:http";
import type { JSX } from "@/jsx/jsx";

export interface RouteComponentProps {
  path: string;
  headers: IncomingHttpHeaders;
}

export interface Route {
  component: (props: RouteComponentProps) => Promise<JSX.Node>;
  title?: string;
}

export type RouteLoader = () => Promise<Route>;

export interface RouteConfig {
  loader: RouteLoader;
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
