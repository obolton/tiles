import { beforeAll, describe, expect, test, vi } from "vitest";
import Router from "@/router/router";
import { redirect } from "@/router/responses";
import { ForbiddenError, NotFoundError } from "@/router/errors";
import type { Respond } from "../server";
import type { RequestProperties, Route, RouteConfig, RouteImporter } from "@/router/router";

// The asset manifest only exists in production builds.
vi.mock("../assets", () => ({
  resolveImport: (path: string) => path,
  getStylesheetsForRouteModule: () => [],
}));

const router = new Router();

vi.mock("../routes", () => ({
  getRouter: () => router,
}));

interface ErrorData {
  status: number;
  message: string;
  path: string;
}

const errorLoader = vi.fn(async ({ url, error }: RequestProperties) => ({
  title: `Error ${error?.status}`,
  headers: { "Cache-Control": "private, no-store" },
  data: {
    status: error?.status ?? 0,
    message: error?.message ?? "",
    path: url.pathname,
  },
}));

function route<T>(moduleUrl: string, config: Route<T>): RouteConfig {
  const importer: RouteImporter<T> = async () => config;
  return { moduleUrl, import: importer as RouteImporter<unknown> };
}

router.add("/", route("/src/routes/index.ts", { component: () => <main>Home</main> }));
router.add(
  "/missing",
  route("/src/routes/missing.ts", {
    loader: async () => {
      throw new NotFoundError();
    },
    component: () => <main>Never rendered</main>,
  }),
);
router.add(
  "/forbidden",
  route("/src/routes/forbidden.ts", {
    middleware: () => {
      throw new ForbiddenError({ headers: { "Set-Cookie": "session=; Max-Age=0" } });
    },
    component: () => <main>Never rendered</main>,
  }),
);
router.add(
  "/broken",
  route("/src/routes/broken.ts", {
    loader: async () => {
      throw new TypeError("Boom");
    },
    component: () => <main>Never rendered</main>,
  }),
);
router.add(
  "/redirect",
  route("/src/routes/redirect.ts", {
    loader: async () => redirect("/", 302),
    component: () => <main>Never rendered</main>,
  }),
);
router.add("/api", route("/src/routes/api.ts", { post: () => new Response("Created") }));
router.addErrorRoute(
  404,
  route("/src/routes/404.ts", {
    loader: errorLoader,
    component: ({ status, message, path }: ErrorData) => (
      <main>
        Error page: {status} {message} at {path}
      </main>
    ),
  }),
);
router.addErrorRoute(
  403,
  route("/src/routes/403.ts", {
    loader: async () => {
      throw new Error("Error page failed");
    },
    component: () => <main>Never rendered</main>,
  }),
);

let respond: Respond;

beforeAll(async () => {
  // Imported after the router is populated, since the server reads it on load.
  respond = (await import("../server")).default;
});

async function get(path: string, method = "GET") {
  return respond(new Request(`http://localhost${path}`, { method }));
}

describe("respond", () => {
  test("renders a matched route", async () => {
    const response = await get("/");
    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe("text/html");
    expect(await response.text()).toContain("<main>Home</main>");
  });

  test("passes through a response returned by a loader", async () => {
    const response = await get("/redirect");
    expect(response.status).toBe(302);
    expect(response.headers.get("Location")).toBe("/");
  });

  test("renders the 404 route for an unmatched path", async () => {
    const response = await get("/nowhere");
    expect(response.status).toBe(404);
    expect(response.statusText).toBe("Not Found");
    expect(response.headers.get("Content-Type")).toBe("text/html");
    expect(response.headers.get("Cache-Control")).toBe("private, no-store");
    const body = await response.text();
    expect(body).toContain("<title>Error 404</title>");
    expect(body).toContain("Error page: 404 Not Found at /nowhere");
  });

  test("renders the 404 route when a loader throws a not found error", async () => {
    const response = await get("/missing");
    expect(response.status).toBe(404);
    expect(await response.text()).toContain("Error page: 404 Not Found at /missing");
  });

  test("renders the 404 route when an API route does not handle the method", async () => {
    const response = await get("/api");
    expect(response.status).toBe(404);
    expect(await response.text()).toContain("Error page: 404 Not Found at /api");
  });

  test("handles API routes", async () => {
    const response = await get("/api", "POST");
    expect(response.status).toBe(200);
    expect(await response.text()).toBe("Created");
  });

  test("falls back to plain text when there is no error route for the status", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const response = await get("/broken");
    expect(response.status).toBe(500);
    expect(response.headers.get("Content-Type")).not.toBe("text/html");
    expect(await response.text()).toBe("Internal Server Error");
    expect(console.error).toHaveBeenCalledWith("http://localhost/broken", new TypeError("Boom"));
  });

  test("falls back to plain text with the error headers when the error route fails", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const response = await get("/forbidden");
    expect(response.status).toBe(403);
    expect(response.headers.get("Set-Cookie")).toBe("session=; Max-Age=0");
    expect(await response.text()).toBe("Forbidden");
    expect(console.error).toHaveBeenCalledWith(
      "Failed to render the 403 page:",
      new Error("Error page failed"),
    );
  });

  test("does not log client errors", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    await get("/missing");
    expect(console.error).not.toHaveBeenCalled();
  });
});
