import { describe, expect, test } from "vitest";
import route from "../workspace";
import { requestProperties } from "@/test/routes";

describe("workspaces/[workspaceId]/settings/workspace", () => {
  test("redirects to the workspace/general settings", async () => {
    const response = await route.get(
      requestProperties({
        url: "http://localhost/workspaces/workspace-id/settings/workspace",
        parameters: { workspaceId: "workspace-id" },
      }),
    );
    expect(response.status).toBe(302);
    expect(response.headers.get("Location")).toBe(
      "/workspaces/workspace-id/settings/workspace/general",
    );
  });
});
