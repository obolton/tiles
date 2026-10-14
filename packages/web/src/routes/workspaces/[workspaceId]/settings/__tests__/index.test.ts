import { describe, expect, test } from "vitest";
import route from "../index";
import { requestProperties } from "@/test/routes";

describe("workspaces/[workspaceId]/settings/index", () => {
  test("redirects to the profile settings", async () => {
    const response = await route.get(
      requestProperties({
        url: "http://localhost/workspaces/workspace-id/settings",
        parameters: { workspaceId: "workspace-id" },
      }),
    );
    expect(response.status).toBe(302);
    expect(response.headers.get("Location")).toBe("/workspaces/workspace-id/settings/profile");
  });
});
