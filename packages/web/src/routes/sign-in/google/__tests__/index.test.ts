import { describe, expect, test, vi, afterAll } from "vitest";
import { GET } from "../index";

// The server env registry only loads in the SSR context.
vi.hoisted(() => vi.stubEnv("SSR", true));

afterAll(() => {
  vi.unstubAllEnvs();
});

const PAGE_ID = "b8c96309-cc54-445b-a274-98b6be12c43f";

function getDestinationCookie(response: Response) {
  return response.headers
    .getSetCookie()
    .find((cookie) => cookie.startsWith("__Host-oauth_dest="))
    ?.split(";")[0];
}

async function get(url: string) {
  return GET({ url: new URL(url), headers: new Headers(), parameters: {} });
}

describe("GET /sign-in/google", () => {
  test("redirects to Google and stores a valid destination", async () => {
    const response = await get(`http://localhost/sign-in/google?destination=pages%2F${PAGE_ID}`);
    expect(response.status).toBe(302);
    expect(response.headers.get("Location")).toContain("response_type=code");
    expect(getDestinationCookie(response)).toBe(`__Host-oauth_dest=pages/${PAGE_ID}`);
  });

  test("stores an empty destination when it is missing or invalid", async () => {
    expect(getDestinationCookie(await get("http://localhost/sign-in/google"))).toBe(
      "__Host-oauth_dest=",
    );
    expect(
      getDestinationCookie(
        await get("http://localhost/sign-in/google?destination=https%3A%2F%2Fevil.com"),
      ),
    ).toBe("__Host-oauth_dest=");
  });
});
