import crypto from "node:crypto";
import * as cookie from "cookie";
import type { SerializeOptions } from "cookie";

const OAUTH2_COOKIE_OPTIONS: SerializeOptions = {
  httpOnly: true,
  secure: true,
  path: "/",
  sameSite: "lax",
};
const OAUTH2_STATE_COOKIE_NAME = "__Host-oauth_state";
const OAUTH2_DESTINATION_COOKIE_NAME = "__Host-oauth_dest";
const OAUTH2_ORIGIN_COOKIE_NAME = "__Host-oauth_origin";
const OAUTH2_COOKIE_MAX_AGE = 60 * 10;
const OAUTH2_STATE_BYTES = 64;

type OAuth2AuthorizationUrlConfig = {
  endpoint: string;
  clientId: string;
  scope: string[];
  redirectUri: string;
  otherAttributes: Record<string, string>;
};

export function getOAuth2AuthorizationUrl({
  endpoint,
  clientId,
  scope,
  redirectUri,
  otherAttributes,
}: OAuth2AuthorizationUrlConfig) {
  const state = createOAuth2State();
  const url = new URL(endpoint);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("scope", scope.join(" "));
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("state", state);
  for (const [key, value] of Object.entries(otherAttributes)) {
    url.searchParams.set(key, value);
  }
  return { url: url.toString(), state };
}

function createOAuth2State() {
  return crypto.randomBytes(OAUTH2_STATE_BYTES).toString("base64url");
}

export function getOAuth2StateCookie(cookies: string) {
  return cookie.parse(cookies)[OAUTH2_STATE_COOKIE_NAME];
}

export function setOAuth2StateCookies(
  state: string,
  destination: string,
  origin?: string,
): [string, string][] {
  const cookies: [string, string][] = [
    [
      "Set-Cookie",
      cookie.serialize(OAUTH2_STATE_COOKIE_NAME, state, {
        ...OAUTH2_COOKIE_OPTIONS,
        maxAge: OAUTH2_COOKIE_MAX_AGE,
      }),
    ],
    [
      "Set-Cookie",
      cookie.serialize(OAUTH2_DESTINATION_COOKIE_NAME, destination, {
        ...OAUTH2_COOKIE_OPTIONS,
        maxAge: OAUTH2_COOKIE_MAX_AGE,
      }),
    ],
  ];
  if (origin) {
    cookies.push([
      "Set-Cookie",
      cookie.serialize(OAUTH2_ORIGIN_COOKIE_NAME, origin, {
        ...OAUTH2_COOKIE_OPTIONS,
        maxAge: OAUTH2_COOKIE_MAX_AGE,
      }),
    ]);
  }
  return cookies;
}

export function getOAuth2DestinationCookie(cookies: string) {
  return cookie.parse(cookies)[OAUTH2_DESTINATION_COOKIE_NAME];
}

export function getOAuth2OriginCookie(cookies: string) {
  return cookie.parse(cookies)[OAUTH2_ORIGIN_COOKIE_NAME];
}

export function clearOAuth2Cookies(): [string, string][] {
  const expireOptions = { ...OAUTH2_COOKIE_OPTIONS, maxAge: 0 };
  return [
    [
      "Set-Cookie",
      cookie.serialize(OAUTH2_STATE_COOKIE_NAME, "", expireOptions),
    ],
    [
      "Set-Cookie",
      cookie.serialize(OAUTH2_DESTINATION_COOKIE_NAME, "", expireOptions),
    ],
    [
      "Set-Cookie",
      cookie.serialize(OAUTH2_ORIGIN_COOKIE_NAME, "", expireOptions),
    ],
  ];
}

/**
 * In development, OAuth flows are handled by a canonical origin to ensure
 * cookies are set and read on the same domain. This function returns the
 * redirect URL if the current request should be forwarded to the OAuth origin.
 */
export function getOAuthOriginRedirect(url: URL): string | undefined {
  const oauthOrigin = process.env.OAUTH_ORIGIN;
  if (!oauthOrigin || url.origin === oauthOrigin) {
    return undefined;
  }
  return new URL(url.pathname + url.search, oauthOrigin).toString();
}

type OAuth2GetAccessTokenOptions = {
  endpoint: string;
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  code: string;
};

// https://developers.google.com/identity/protocols/oauth2/web-server#exchange-authorization-code
export async function getOAuth2AccessToken({
  endpoint,
  clientId,
  clientSecret,
  redirectUri,
  code,
}: OAuth2GetAccessTokenOptions) {
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    redirect_uri: redirectUri,
    client_id: clientId,
    client_secret: clientSecret,
    code,
  });
  const headers = new Headers({
    "Content-Type": "application/x-www-form-urlencoded",
  });
  const response = await fetch(endpoint, {
    method: "POST",
    body,
    headers,
  });
  if (!response.ok) {
    throw new Error(`Failed to get access token: ${response.statusText}`);
  }
  const data = await response.json();
  if (typeof data !== "object") {
    throw new Error(`Invalid access token response`);
  }
  const accessToken = data.access_token;
  if (typeof accessToken !== "string") {
    throw new Error(`Invalid access token`);
  }
  return accessToken;
}
