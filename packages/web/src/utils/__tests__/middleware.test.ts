import { describe, expect, test } from "vitest";
import { authenticatedRoute } from "../middleware";
import { SESSION_COOKIE } from "@/test/routes";

describe("authenticatedRoute", () => {
  test("redirects signed-out users to sign in", () => {
    const response = authenticatedRoute(new Request("http://localhost/workspaces/workspace-id"));
    expect(response?.status).toBe(302);
    expect(response?.headers.get("Location")).toBe("/sign-in");
  });

  test("allows signed-in users through", () => {
    const response = authenticatedRoute(
      new Request("http://localhost/workspaces/workspace-id", {
        headers: { cookie: SESSION_COOKIE },
      }),
    );
    expect(response).toBeUndefined();
  });
});
