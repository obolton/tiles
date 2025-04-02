import type { IncomingMessage, ServerResponse } from "node:http";

export type RouteHandler = (req: IncomingMessage, res: ServerResponse) => void;

export interface Routes {
  [name: string]: Router | RouteHandler;
}

export interface RouterConfig {
  index?: RouteHandler;
  resolve?: Router | RouteHandler;
  routes?: Routes;
}

export type Path = string[];

export default class Router {
  index?: RouteHandler;
  routes?: Routes;
  resolve?: Router | RouteHandler;

  constructor({ index, routes, resolve }: RouterConfig) {
    this.index = index;
    this.routes = routes;
    this.resolve = resolve;
  }

  match(path: Path): RouteHandler | null {
    if (path.length === 0 || !path[0]) {
      return this.index ?? null;
    }

    const segment = path[0];

    if (
      this.routes &&
      Object.prototype.hasOwnProperty.call(this.routes, segment)
    ) {
      const route = this.routes[segment];
      if (!route) {
        return null;
      } else if (route instanceof Router) {
        return route.match(path.slice(1));
      } else if (path.length === 1) {
        return route;
      } else {
        return null;
      }
    }

    if (this.resolve) {
      if (this.resolve instanceof Router) {
        return this.resolve.match(path.slice(1));
      } else if (path.length === 1) {
        return this.resolve;
      } else {
        return null;
      }
    }

    return null;
  }
}
