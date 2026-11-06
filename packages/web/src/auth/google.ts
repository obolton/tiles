import { createRemoteJWKSet, jwtVerify } from "jose";
import { serverEnv } from "@/env/server";
import { getOAuth2AuthorizationUrl, getOAuth2AccessToken } from "./oauth2";

const AUTHORIZATION_ENDPOINT = import.meta.env.DEV
  ? "https://localhost/sign-in/google"
  : "https://accounts.google.com/o/oauth2/v2/auth";
const TOKEN_ENDPOINT = "https://oauth2.googleapis.com/token";
const SCOPES = ["openid", "profile", "email"];

export function getGoogleAuthorizationUrl() {
  return getOAuth2AuthorizationUrl({
    endpoint: AUTHORIZATION_ENDPOINT,
    clientId: serverEnv.GOOGLE_CLIENT_ID,
    redirectUri: serverEnv.GOOGLE_REDIRECT_URI,
    scope: SCOPES,
    otherAttributes: {
      access_type: "online",
      include_granted_scopes: "false",
    },
  });
}

const GOOGLE_JWKS = createRemoteJWKSet(new URL("https://www.googleapis.com/oauth2/v3/certs"));

type ExchangeCodeOptions = {
  code: string;
  codeVerifier: string;
};

export async function exchangeCode({ code, codeVerifier }: ExchangeCodeOptions) {
  return getOAuth2AccessToken({
    endpoint: TOKEN_ENDPOINT,
    clientId: serverEnv.GOOGLE_CLIENT_ID,
    clientSecret: serverEnv.GOOGLE_CLIENT_SECRET,
    redirectUri: serverEnv.GOOGLE_REDIRECT_URI,
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
    audience: serverEnv.GOOGLE_CLIENT_ID,
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
