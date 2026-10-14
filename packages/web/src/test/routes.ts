import { vi } from "vitest";
import { SESSION_COOKIE_NAME, SIGNED_IN_FLAG_COOKIE_NAME } from "api/constants/cookies";
import type { RequestProperties, RouteData, RouteParameters } from "@/router/router";

export const SESSION_ID = "session-id";
export const SESSION_COOKIE = `${SESSION_COOKIE_NAME}=${SESSION_ID}`;

interface RequestOptions {
  url?: string;
  cookie?: string;
  parameters?: RouteParameters;
}

export function requestProperties({
  url = "http://localhost/",
  cookie,
  parameters = {},
}: RequestOptions = {}): RequestProperties {
  return {
    url: new URL(url),
    headers: new Headers(cookie ? { cookie } : {}),
    parameters,
  };
}

/** Stubs the client-side signed-in flag cookie read by `isSignedIn`. */
export function stubSignedIn(signedIn: boolean) {
  vi.spyOn(document, "cookie", "get").mockReturnValue(
    signedIn ? `${SIGNED_IN_FLAG_COOKIE_NAME}=1` : "",
  );
}

export function unwrapData<T>(result: RouteData<T> | Response) {
  if (result instanceof Response) {
    throw new Error(`Expected loader data, got a ${result.status} response`);
  }
  return result;
}

export function unwrapResponse(result: unknown) {
  if (!(result instanceof Response)) {
    throw new Error("Expected a Response");
  }
  return result;
}
