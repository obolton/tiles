import { describe, expect, test } from "vitest";
import { SESSION_COOKIE_NAME } from "api/constants/cookies";
import { signedOutRoute, loader } from "../index";

const PAGE_ID = "b8c96309-cc54-445b-a274-98b6be12c43f";
const SIGNED_IN_HEADERS = { cookie: `${SESSION_COOKIE_NAME}=session-id` };

describe("signedOutRoute", () => {
  test("redirects signed-in users to the index route", () => {
    const response = signedOutRoute(
      new Request("http://localhost/sign-in", { headers: SIGNED_IN_HEADERS }),
    );
    expect(response?.status).toBe(302);
    expect(response?.headers.get("Location")).toBe("/");
  });

  test("redirects signed-in users to a valid destination", () => {
    const response = signedOutRoute(
      new Request(`http://localhost/sign-in?destination=pages%2F${PAGE_ID}`, {
        headers: SIGNED_IN_HEADERS,
      }),
    );
    expect(response?.headers.get("Location")).toBe(`/pages/${PAGE_ID}`);
  });

  test("ignores an invalid destination for signed-in users", () => {
    const response = signedOutRoute(
      new Request("http://localhost/sign-in?destination=https%3A%2F%2Fevil.com", {
        headers: SIGNED_IN_HEADERS,
      }),
    );
    expect(response?.headers.get("Location")).toBe("/");
  });

  test("allows signed-out users through", () => {
    expect(signedOutRoute(new Request("http://localhost/sign-in"))).toBeUndefined();
  });
});

describe("loader", () => {
  test("returns no error or destination by default", async () => {
    await expect(
      loader({ url: new URL("http://localhost/sign-in"), headers: new Headers(), parameters: {} }),
    ).resolves.toMatchObject({
      title: "Sign in - Tiles",
      data: { destination: null, error: null },
    });
  });

  test("passes a valid destination through", async () => {
    await expect(
      loader({
        url: new URL(`http://localhost/sign-in?destination=pages%2F${PAGE_ID}`),
        headers: new Headers(),
        parameters: {},
      }),
    ).resolves.toMatchObject({ data: { destination: `pages/${PAGE_ID}` } });
  });

  test("drops an invalid destination", async () => {
    await expect(
      loader({
        url: new URL("http://localhost/sign-in?destination=https%3A%2F%2Fevil.com"),
        headers: new Headers(),
        parameters: {},
      }),
    ).resolves.toMatchObject({ data: { destination: null } });
  });

  test("parses known errors", async () => {
    await expect(
      loader({
        url: new URL("http://localhost/sign-in?error=cancelled"),
        headers: new Headers(),
        parameters: {},
      }),
    ).resolves.toMatchObject({ data: { error: "cancelled" } });
    await expect(
      loader({
        url: new URL("http://localhost/sign-in?error=failed"),
        headers: new Headers(),
        parameters: {},
      }),
    ).resolves.toMatchObject({ data: { error: "failed" } });
  });

  test("ignores unknown errors", async () => {
    await expect(
      loader({
        url: new URL("http://localhost/sign-in?error=other"),
        headers: new Headers(),
        parameters: {},
      }),
    ).resolves.toMatchObject({ data: { error: null } });
  });
});
