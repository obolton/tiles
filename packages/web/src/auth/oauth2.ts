import crypto from "node:crypto";
import { parseCookie, stringifySetCookie } from "cookie";
import type { SerializeOptions } from "cookie";

const OAUTH2_COOKIE_OPTIONS: SerializeOptions = {
  httpOnly: true,
  secure: true,
  path: "/",
  sameSite: "lax",
};
const OAUTH2_STATE_COOKIE_NAME = "__Host-oauth_state";
const OAUTH2_DESTINATION_COOKIE_NAME = "__Host-oauth_dest";
const OAUTH2_VERIFIER_COOKIE_NAME = "__Host-oauth_verifier";
const OAUTH2_NONCE_COOKIE_NAME = "__Host-oauth_nonce";
const OAUTH2_COOKIE_MAX_AGE = 60 * 10;
const OAUTH2_STATE_BYTES = 64;
const OAUTH2_VERIFIER_BYTES = 32;
const OAUTH2_NONCE_BYTES = 32;

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
  const verifier = createPKCEVerifier();
  const challenge = createPKCEChallenge(verifier);
  const nonce = createNonce();
  const url = new URL(endpoint);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("scope", scope.join(" "));
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("state", state);
  url.searchParams.set("code_challenge", challenge);
  url.searchParams.set("code_challenge_method", "S256");
  url.searchParams.set("nonce", nonce);
  for (const [key, value] of Object.entries(otherAttributes)) {
    url.searchParams.set(key, value);
  }
  return { url: url.toString(), state, verifier, nonce };
}

function createOAuth2State() {
  return crypto.randomBytes(OAUTH2_STATE_BYTES).toString("base64url");
}

function createPKCEVerifier() {
  return crypto.randomBytes(OAUTH2_VERIFIER_BYTES).toString("base64url");
}

function createPKCEChallenge(verifier: string) {
  return crypto.createHash("sha256").update(verifier).digest("base64url");
}

function createNonce() {
  return crypto.randomBytes(OAUTH2_NONCE_BYTES).toString("base64url");
}

export type SignInError = "cancelled" | "failed";

/** The sign-in page URL to return to when a sign-in attempt fails, keeping the destination. */
export function getSignInErrorUrl(error: SignInError, destination: string | null) {
  const params = new URLSearchParams({ error });
  if (destination) {
    params.set("destination", destination);
  }
  return `/sign-in?${params}`;
}

export type OAuth2Cookies = {
  state: string | null;
  verifier: string | null;
  nonce: string | null;
  destination: string | null;
};

export function getOAuth2Cookies(cookies: string): OAuth2Cookies {
  const parsed = parseCookie(cookies);
  return {
    state: parsed[OAUTH2_STATE_COOKIE_NAME] ?? null,
    verifier: parsed[OAUTH2_VERIFIER_COOKIE_NAME] ?? null,
    nonce: parsed[OAUTH2_NONCE_COOKIE_NAME] ?? null,
    destination: parsed[OAUTH2_DESTINATION_COOKIE_NAME] ?? null,
  };
}

export function compareOAuth2State(a: string, b: string): boolean {
  const encoder = new TextEncoder();
  const aBytes = encoder.encode(a);
  const bBytes = encoder.encode(b);
  if (aBytes.length !== bBytes.length) {
    return false;
  }
  return crypto.timingSafeEqual(aBytes, bBytes);
}

type SetOAuth2CookiesOptions = {
  state: string;
  verifier: string;
  nonce: string;
  destination: string;
};

export function setOAuth2Cookies({
  state,
  verifier,
  nonce,
  destination,
}: SetOAuth2CookiesOptions): [string, string][] {
  return [
    [
      "Set-Cookie",
      stringifySetCookie({
        name: OAUTH2_STATE_COOKIE_NAME,
        value: state,
        ...OAUTH2_COOKIE_OPTIONS,
        maxAge: OAUTH2_COOKIE_MAX_AGE,
      }),
    ],
    [
      "Set-Cookie",
      stringifySetCookie({
        name: OAUTH2_VERIFIER_COOKIE_NAME,
        value: verifier,
        ...OAUTH2_COOKIE_OPTIONS,
        maxAge: OAUTH2_COOKIE_MAX_AGE,
      }),
    ],
    [
      "Set-Cookie",
      stringifySetCookie({
        name: OAUTH2_NONCE_COOKIE_NAME,
        value: nonce,
        ...OAUTH2_COOKIE_OPTIONS,
        maxAge: OAUTH2_COOKIE_MAX_AGE,
      }),
    ],
    [
      "Set-Cookie",
      stringifySetCookie({
        name: OAUTH2_DESTINATION_COOKIE_NAME,
        value: destination,
        ...OAUTH2_COOKIE_OPTIONS,
        maxAge: OAUTH2_COOKIE_MAX_AGE,
      }),
    ],
  ];
}

export function clearOAuth2Cookies(): [string, string][] {
  const expireOptions = { ...OAUTH2_COOKIE_OPTIONS, maxAge: 0 };
  return [
    [
      "Set-Cookie",
      stringifySetCookie({ name: OAUTH2_STATE_COOKIE_NAME, value: "", ...expireOptions }),
    ],
    [
      "Set-Cookie",
      stringifySetCookie({ name: OAUTH2_VERIFIER_COOKIE_NAME, value: "", ...expireOptions }),
    ],
    [
      "Set-Cookie",
      stringifySetCookie({ name: OAUTH2_NONCE_COOKIE_NAME, value: "", ...expireOptions }),
    ],
    [
      "Set-Cookie",
      stringifySetCookie({ name: OAUTH2_DESTINATION_COOKIE_NAME, value: "", ...expireOptions }),
    ],
  ];
}

type OAuth2GetAccessTokenOptions = {
  endpoint: string;
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  code: string;
  codeVerifier: string;
};

export type OAuth2TokenResponse = {
  accessToken: string;
  idToken: string;
};

// https://developers.google.com/identity/protocols/oauth2/web-server#exchange-authorization-code
export async function getOAuth2AccessToken({
  endpoint,
  clientId,
  clientSecret,
  redirectUri,
  code,
  codeVerifier,
}: OAuth2GetAccessTokenOptions): Promise<OAuth2TokenResponse> {
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    redirect_uri: redirectUri,
    client_id: clientId,
    client_secret: clientSecret,
    code,
    code_verifier: codeVerifier,
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
  if (typeof data !== "object" || data === null) {
    throw new Error("Invalid token response");
  }
  const { access_token: accessToken, id_token: idToken } = data as Record<string, unknown>;
  if (typeof accessToken !== "string") {
    throw new Error("Invalid access token");
  }
  if (typeof idToken !== "string") {
    throw new Error("Invalid ID token");
  }
  return { accessToken, idToken };
}
