import { describe, expect, test } from "vitest";
import { SESSION_COOKIE_NAME } from "api/constants/cookies";
import { authenticatedRoute } from "../middleware";

const WORKSPACE_ID = "31042e0b-f7e7-4fe1-a361-28780bf53ee9";

describe("authenticatedRoute", () => {
  test("allows signed-in users through", () => {
    const response = authenticatedRoute(
      new Request(`http://localhost/workspaces/${WORKSPACE_ID}`, {
        headers: { cookie: `${SESSION_COOKIE_NAME}=session-id` },
      }),
    );
    expect(response).toBeUndefined();
  });

  test("redirects signed-out users to the sign-in page with the requested path as destination", () => {
    const response = authenticatedRoute(
      new Request(`http://localhost/workspaces/${WORKSPACE_ID}/shared?sort=name`),
    );
    expect(response?.status).toBe(302);
    expect(response?.headers.get("Location")).toBe(
      `/sign-in?destination=workspaces%2F${WORKSPACE_ID}%2Fshared`,
    );
  });

  test("omits paths that are not valid destinations", () => {
    const response = authenticatedRoute(new Request("http://localhost/not-a-route"));
    expect(response?.headers.get("Location")).toBe("/sign-in");
  });
});
