import { beforeEach, describe, expect, test, vi } from "vitest";
import respond, { collectStylesheets, getLinks, mergeRouteMetadata } from "../server";
import { redirect } from "@/router/responses";
import { SITE_NAME } from "@/constants/site";
import { CACHE_CONTROL_VALUE } from "@/constants/cdn";
import type { APIRequestHandler, Route } from "@/router/router";

const MODULE_URL = "/src/routes/items/[id].ts";

const state = vi.hoisted(() => ({ module: undefined as Route<unknown> | undefined }));

// The asset manifests only exist in production builds.
vi.mock("../assets", () => ({
  resolveImport: (path: string) => path,
  getStylesheetsForRouteModule: () => [],
}));

vi.mock("../routes", async () => {
  const { default: Router } = await import("@/router/router");
  return {
    getRouter() {
      const router = new Router();
      router.add("items/:id", {
        moduleUrl: "/src/routes/items/[id].ts",
        import: async () => {
          if (!state.module) {
            throw new Error("Route module not set");
          }
          return state.module;
        },
      });
      return router;
    },
  };
});

function component(data: unknown) {
  return <main>{String(data)}</main>;
}

function request(path = "/items/42", init?: RequestInit) {
  return new Request(`http://localhost${path}`, init);
}

interface FakeModule {
  id: string | null;
  url: string;
  importedModules: Set<FakeModule>;
}

function fakeModule(url: string, imports: FakeModule[] = [], id: string | null = url): FakeModule {
  return { id, url, importedModules: new Set(imports) };
}

function fakeServer(root: FakeModule) {
  return {
    moduleGraph: {
      getModuleByUrl: async (url: string) => (url === root.url ? root : undefined),
    },
  };
}

function routeContext(html: string) {
  const match = html.match(/<script id="route-context" type="application\/json">(.*?)<\/script>/);
  return match?.[1] ? JSON.parse(match[1]) : undefined;
}

describe("getLinks", () => {
  test("formats preload links with and without crossorigin", () => {
    expect(
      getLinks([
        { href: "/a.css", type: "style" },
        { href: "/b.js", type: "script", crossorigin: true },
      ]),
    ).toEqual(["</a.css>; rel=preload; as=style", "</b.js>; rel=preload; as=script; crossorigin"]);
  });
});

describe("mergeRouteMetadata", () => {
  test("concatenates each key in order", () => {
    expect(
      mergeRouteMetadata(
        { links: [{ rel: "preload", href: "/a" }], scripts: [{ src: "/a.js" }] },
        { styles: [{ content: "a{}" }] },
        { links: [{ rel: "preload", href: "/b" }], styles: [{ content: "b{}" }] },
      ),
    ).toEqual({
      links: [
        { rel: "preload", href: "/a" },
        { rel: "preload", href: "/b" },
      ],
      scripts: [{ src: "/a.js" }],
      styles: [{ content: "a{}" }, { content: "b{}" }],
    });
  });

  test("ignores missing keys", () => {
    expect(mergeRouteMetadata({}, { links: undefined, scripts: undefined })).toEqual({});
  });
});

describe("collectStylesheets", () => {
  test("returns nothing without a dev server or module", async () => {
    await expect(collectStylesheets(MODULE_URL)).resolves.toEqual([]);
    await expect(
      collectStylesheets("/missing.ts", fakeServer(fakeModule(MODULE_URL))),
    ).resolves.toEqual([]);
  });

  test("walks imported modules once each and collects stylesheets", async () => {
    const shared = fakeModule("/src/shared.css");
    const componentModule = fakeModule("/src/Component.tsx", [
      shared,
      fakeModule("/src/Component.module.css"),
    ]);
    const root = fakeModule(MODULE_URL, [
      componentModule,
      shared,
      fakeModule("/src/untracked.css", [], null),
    ]);
    componentModule.importedModules.add(root);

    await expect(collectStylesheets(MODULE_URL, fakeServer(root))).resolves.toEqual([
      "/src/shared.css",
      "/src/Component.module.css",
    ]);
  });
});

describe("respond", () => {
  beforeEach(() => {
    state.module = undefined;
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  test("returns not found for an unmatched path", async () => {
    const response = await respond(request("/missing"));
    expect(response.status).toBe(404);
  });

  test("returns an internal error when the route module fails to load", async () => {
    const response = await respond(request());
    expect(response.status).toBe(500);
    expect(console.error).toHaveBeenCalled();
  });

  describe("API routes", () => {
    test.each(["GET", "POST", "PUT", "PATCH", "DELETE"] as const)(
      "dispatches %s requests to the matching handler",
      async (method) => {
        const handler = vi.fn<APIRequestHandler>(() => new Response(method));
        state.module = { [method.toLowerCase()]: handler };

        const response = await respond(
          request("/items/42?q=1", { method, headers: { cookie: "a=1" } }),
        );

        expect(await response.text()).toBe(method);
        expect(handler).toHaveBeenCalledExactlyOnceWith({
          url: new URL("http://localhost/items/42?q=1"),
          headers: expect.any(Headers),
          parameters: { id: "42" },
        });
        expect(handler.mock.calls[0]?.[0].headers.get("cookie")).toBe("a=1");
      },
    );

    test("returns not found for a method without a handler", async () => {
      state.module = { get: () => new Response("ok") };

      expect((await respond(request("/items/42", { method: "POST" }))).status).toBe(404);
      expect((await respond(request("/items/42", { method: "OPTIONS" }))).status).toBe(404);
    });

    test("returns an internal error when the handler throws", async () => {
      state.module = {
        get: () => {
          throw new Error("Boom");
        },
      };

      const response = await respond(request());

      expect(response.status).toBe(500);
      expect(console.error).toHaveBeenCalledWith("Route error:", expect.any(Error));
    });
  });

  describe("component routes", () => {
    test("short-circuits when the middleware returns a response", async () => {
      const loader = vi.fn();
      state.module = {
        middleware: () => redirect("/sign-in", 302),
        loader,
        component,
      };

      const response = await respond(request());

      expect(response.status).toBe(302);
      expect(response.headers.get("Location")).toBe("/sign-in");
      expect(loader).not.toHaveBeenCalled();
    });

    test("continues when the middleware returns nothing", async () => {
      const middleware = vi.fn();
      state.module = { middleware, component };

      const response = await respond(request());

      expect(response.status).toBe(200);
      expect(middleware).toHaveBeenCalledExactlyOnceWith(expect.any(Request));
    });

    test("returns an internal error when the middleware throws", async () => {
      state.module = {
        middleware: () => {
          throw new Error("Boom");
        },
        component,
      };

      const response = await respond(request());

      expect(response.status).toBe(500);
      expect(console.error).toHaveBeenCalledWith("Middleware error:", expect.any(Error));
    });

    test("passes a loader response through with its headers", async () => {
      state.module = {
        loader: async () => redirect("/elsewhere", 302, [["Set-Cookie", "a=1"]]),
        component,
      };

      const response = await respond(request());

      expect(response.status).toBe(302);
      expect(response.headers.get("Location")).toBe("/elsewhere");
      expect(response.headers.getSetCookie()).toEqual(["a=1"]);
    });

    test("returns an internal error when the loader throws", async () => {
      state.module = {
        loader: () => Promise.reject(new Error("Boom")),
        component,
      };

      const response = await respond(request());

      expect(response.status).toBe(500);
      expect(console.error).toHaveBeenCalledWith("http://localhost/items/42", expect.any(Error));
    });

    test("renders a document from the loader data", async () => {
      state.module = {
        loader: async ({ parameters }) => ({
          headers: { "Cache-Control": CACHE_CONTROL_VALUE },
          title: `Item <${parameters.id}>`,
          description: "An item.",
          bodyAttributes: { "data-page-id": "page-id" },
          metadata: { styles: [{ content: "b{}</style><script>" }] },
          data: "item data",
        }),
        component,
        metadata: {
          links: [{ rel: "preload", href: "/font.woff2", as: "font", crossorigin: true }],
          scripts: [{ src: "/src/routes/items/init.ts" }],
        },
      };

      const response = await respond(request());
      const html = await response.text();

      expect(response.status).toBe(200);
      expect(response.headers.get("Content-Type")).toBe("text/html");
      expect(response.headers.get("X-Content-Type-Options")).toBe("nosniff");
      expect(response.headers.get("Cache-Control")).toBe(CACHE_CONTROL_VALUE);
      expect(response.headers.get("Link")).toBe(
        "</src/global.ts>; rel=preload; as=script; crossorigin, " +
          "</src/routes/items/init.ts>; rel=preload; as=script; crossorigin",
      );

      expect(html.startsWith('<!doctype html><html lang="en"><head><meta charset="utf-8">')).toBe(
        true,
      );
      expect(html.endsWith("</body></html>")).toBe(true);
      expect(html).toContain("<title>Item &lt;42&gt;</title>");
      expect(html).toContain('<meta name="description" content="An item.">');
      // Global, route and loader metadata are all emitted
      expect(html).toContain('<script type="module" src="/src/global.ts"></script>');
      expect(html).toContain("<style>@font-face{");
      expect(html).toContain('<link rel="preload" href="/font.woff2" as="font" crossorigin>');
      expect(html).toContain('<script type="module" src="/src/routes/items/init.ts"></script>');
      expect(html).toContain("<style>b{}<\\/style><script></style>");
      expect(html).toContain('<body data-page-id="page-id"><main>item data</main>');
      expect(html).not.toContain("route-context");
      expect(html).not.toContain("/src/server/hydrate.ts");
    });

    test("renders without a loader", async () => {
      state.module = { component };

      const response = await respond(request());
      const html = await response.text();

      expect(response.status).toBe(200);
      expect(html).toContain(`<title>${SITE_NAME}</title>`);
      expect(html).toContain("<body><main>undefined</main></body>");
    });

    test("embeds the route context and hydration script for immediate hydration", async () => {
      state.module = { component, hydrate: "immediate" };

      const response = await respond(request());
      const html = await response.text();

      expect(response.headers.get("Link")).toContain(
        "</src/server/hydrate.ts>; rel=preload; as=script; crossorigin",
      );
      expect(html).toContain('<script type="module" src="/src/server/hydrate.ts"></script>');
      expect(routeContext(html)).toEqual({ module: MODULE_URL, params: { id: "42" } });
    });

    test("embeds the route context without the hydration script for deferred hydration", async () => {
      state.module = { component, hydrate: "deferred" };

      const response = await respond(request());
      const html = await response.text();

      expect(html).not.toContain("/src/server/hydrate.ts");
      expect(routeContext(html)).toEqual({ module: MODULE_URL, params: { id: "42" } });
    });

    test("links the stylesheets from the dev server module graph", async () => {
      state.module = { component };
      const root = fakeModule(MODULE_URL, [fakeModule("/src/a.css")]);

      const response = await respond(request(), fakeServer(root));
      const html = await response.text();

      expect(response.headers.get("Link")).toMatch(/^<\/src\/a\.css>; rel=preload; as=style, /);
      expect(html).toContain('<link rel="stylesheet" href="/src/a.css">');
    });
  });
});
