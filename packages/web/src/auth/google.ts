import assert from "node:assert";
import { createRemoteJWKSet, jwtVerify } from "jose";
import { getOAuth2AuthorizationUrl, getOAuth2AccessToken } from "./oauth2";

const AUTHORIZATION_ENDPOINT = "https://accounts.google.com/o/oauth2/v2/auth";
const TOKEN_ENDPOINT = "https://oauth2.googleapis.com/token";
const SCOPES = ["openid", "profile", "email"];

assert(process.env.GOOGLE_CLIENT_ID);
assert(process.env.GOOGLE_CLIENT_SECRET);
assert(process.env.GOOGLE_REDIRECT_URI);

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI;

export function getGoogleAuthorizationUrl() {
  return getOAuth2AuthorizationUrl({
    endpoint: AUTHORIZATION_ENDPOINT,
    clientId: GOOGLE_CLIENT_ID,
    redirectUri: GOOGLE_REDIRECT_URI,
    scope: SCOPES,
    otherAttributes: {
      access_type: "online",
      include_granted_scopes: "false",
    },
  });
}

const GOOGLE_JWKS = createRemoteJWKSet(
  new URL("https://www.googleapis.com/oauth2/v3/certs"),
);

type ExchangeCodeOptions = {
  code: string;
  codeVerifier: string;
};

export async function exchangeCode({
  code,
  codeVerifier,
}: ExchangeCodeOptions) {
  return getOAuth2AccessToken({
    endpoint: TOKEN_ENDPOINT,
    clientId: GOOGLE_CLIENT_ID,
    clientSecret: GOOGLE_CLIENT_SECRET,
    redirectUri: GOOGLE_REDIRECT_URI,
    code,
    codeVerifier,
  });
}

export type GoogleUser = {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  imageUrl: string;
};

type VerifyIdTokenOptions = {
  idToken: string;
  expectedNonce: string;
};

export async function verifyIdToken({
  idToken,
  expectedNonce,
}: VerifyIdTokenOptions): Promise<GoogleUser> {
  const { payload } = await jwtVerify(idToken, GOOGLE_JWKS, {
    issuer: "https://accounts.google.com",
    audience: GOOGLE_CLIENT_ID,
  });

  if (payload.nonce !== expectedNonce) {
    throw new Error("Invalid nonce in ID token");
  }

  const { sub, name, email, email_verified, picture } = payload;

  if (
    typeof sub !== "string" ||
    typeof name !== "string" ||
    typeof email !== "string" ||
    typeof email_verified !== "boolean" ||
    typeof picture !== "string"
  ) {
    throw new Error("Invalid claims in ID token");
  }

  return {
    id: sub,
    name,
    email,
    emailVerified: email_verified,
    imageUrl: picture,
  };
}
