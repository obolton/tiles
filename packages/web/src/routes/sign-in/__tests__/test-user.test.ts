import { describe, expect, test, vi } from "vitest";
import { GET } from "../test-user";

vi.mock("@/auth/sessions", () => ({
  signIn: vi.fn().mockResolvedValue({ id: "session-1", expiresAt: "2030-01-01T00:00:00.000Z" }),
  setAuthenticationCookies: vi.fn().mockReturnValue(new Headers()),
}));

const WORKSPACE_ID = "31042e0b-f7e7-4fe1-a361-28780bf53ee9";

async function get(url: string) {
  return GET({ url: new URL(url), headers: new Headers(), parameters: {} });
}

describe("GET /sign-in/test-user", () => {
  test("signs in and redirects to the index route", async () => {
    const response = await get("http://localhost/sign-in/test-user");
    expect(response.status).toBe(302);
    expect(response.headers.get("Location")).toBe("/");
  });

  test("redirects to a valid destination", async () => {
    const response = await get(
      `http://localhost/sign-in/test-user?destination=workspaces%2F${WORKSPACE_ID}`,
    );
    expect(response.headers.get("Location")).toBe(`/workspaces/${WORKSPACE_ID}`);
  });
});
