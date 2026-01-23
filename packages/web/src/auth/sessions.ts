import assert from "node:assert";
import * as cookie from "cookie";
import client, { type AppRouterInputs } from "../api/client";
import {
  SESSION_COOKIE_NAME,
  SIGNED_IN_FLAG_COOKIE_NAME,
} from "api/constants/cookies";
import type { SerializeOptions } from "cookie";

assert(import.meta.env.PUBLIC_SESSION_COOKIE_DOMAIN);

const SESSION_COOKIE_DOMAIN = import.meta.env.PUBLIC_SESSION_COOKIE_DOMAIN;

const SESSION_COOKIE_OPTIONS: SerializeOptions = {
  httpOnly: true,
  secure: true,
  path: "/",
  sameSite: "lax",
  domain: SESSION_COOKIE_DOMAIN,
};

const SIGNED_IN_FLAG_COOKIE_OPTIONS: SerializeOptions = {
  httpOnly: false,
  secure: true,
  path: "/",
  sameSite: "lax",
  domain: SESSION_COOKIE_DOMAIN,
};

type SignInOptions = AppRouterInputs["auth"]["signIn"];

export async function signIn({
  provider,
  providerId,
  name,
  email,
  emailVerified,
  imageUrl,
}: SignInOptions) {
  return client.auth.signIn.mutate({
    provider,
    providerId,
    name,
    email,
    emailVerified,
    imageUrl,
  });
}

export function setAuthenticationCookies(sessionId: string, expiresAt: Date) {
  return new Headers([
    [
      "Set-Cookie",
      cookie.serialize(SESSION_COOKIE_NAME, sessionId, {
        ...SESSION_COOKIE_OPTIONS,
        expires: expiresAt,
      }),
    ],
    [
      "Set-Cookie",
      cookie.serialize(SIGNED_IN_FLAG_COOKIE_NAME, "1", {
        ...SIGNED_IN_FLAG_COOKIE_OPTIONS,
        expires: expiresAt,
      }),
    ],
  ]);
}
