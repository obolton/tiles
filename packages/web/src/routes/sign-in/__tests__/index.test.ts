import { describe, expect, test } from "vitest";
import { SESSION_COOKIE_NAME } from "api/constants/cookies";
import { signedOutRoute } from "../index";

describe("signedOutRoute", () => {
  test("redirects signed-in users to the index route", () => {
    const response = signedOutRoute(
      new Request("http://localhost/sign-in", {
        headers: { cookie: `${SESSION_COOKIE_NAME}=session-id` },
      }),
    );
    expect(response?.status).toBe(302);
    expect(response?.headers.get("Location")).toBe("/");
  });

  test("allows signed-out users through", () => {
    expect(signedOutRoute(new Request("http://localhost/sign-in"))).toBeUndefined();
  });
});
