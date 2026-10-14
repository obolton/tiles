import { afterEach, describe, expect, test, vi } from "vitest";
import route, { signedOutRoute } from "../index";
import { requestProperties, SESSION_COOKIE, unwrapData } from "@/test/routes";

vi.mock("@/api/client", () => import("@/test/mocks/apiClient"));

describe("signedOutRoute", () => {
  test("redirects signed-in users to the index route", () => {
    const response = signedOutRoute(
      new Request("http://localhost/sign-in", { headers: { cookie: SESSION_COOKIE } }),
    );
    expect(response?.status).toBe(302);
    expect(response?.headers.get("Location")).toBe("/");
  });

  test("allows signed-out users through", () => {
    expect(signedOutRoute(new Request("http://localhost/sign-in"))).toBeUndefined();
  });
});

// The middleware and loader are only attached during SSR.
async function loadServerRoute() {
  vi.resetModules();
  vi.stubEnv("SSR", true);
  const { default: serverRoute } = await import("../index");
  if (!serverRoute.loader) {
    throw new Error("Expected the server route to have a loader");
  }
  return serverRoute.loader;
}

describe("loader", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  test("is omitted from the client module along with the middleware", () => {
    expect(route.loader).toBeUndefined();
    expect(route.middleware).toBeUndefined();
  });

  test("passes the requested destination to the page", async () => {
    const loader = await loadServerRoute();

    const result = unwrapData(
      await loader(
        requestProperties({ url: "http://localhost/sign-in?destination=invites%2Faccept%2Fkey" }),
      ),
    );

    expect(result.title).toBe("Sign in - Tiles");
    expect(result.data).toEqual({ destination: "invites/accept/key" });
  });

  test("passes a null destination when none is requested", async () => {
    const loader = await loadServerRoute();

    const result = unwrapData(await loader(requestProperties({ url: "http://localhost/sign-in" })));

    expect(result.data).toEqual({ destination: null });
  });
});
