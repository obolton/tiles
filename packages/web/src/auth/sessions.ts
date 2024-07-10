import assert from "node:assert";
import client, { type AppRouterInputs } from "../api/client";
import { SESSION_COOKIE_NAME, SIGNED_IN_FLAG_COOKIE_NAME } from "./constants";
import type { AstroCookies, AstroCookieSetOptions } from "astro";

assert(import.meta.env.SESSION_COOKIE_DOMAIN);

const SESSION_COOKIE_OPTIONS: AstroCookieSetOptions = {
  httpOnly: true,
  secure: true,
  path: "/",
  sameSite: "strict",
  domain: import.meta.env.SESSION_COOKIE_DOMAIN,
};

const SIGNED_IN_FLAG_COOKIE_OPTIONS: AstroCookieSetOptions = {
  httpOnly: false,
  secure: true,
  path: "/",
  sameSite: "strict",
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

export function setAuthenticationCookies(
  cookies: AstroCookies,
  sessionId: string,
  expiresAt: Date,
) {
  cookies.set(SESSION_COOKIE_NAME, sessionId, {
    ...SESSION_COOKIE_OPTIONS,
    expires: expiresAt,
  });
  cookies.set(SIGNED_IN_FLAG_COOKIE_NAME, "1", {
    ...SIGNED_IN_FLAG_COOKIE_OPTIONS,
    expires: expiresAt,
  });
}

export function clearSessionCookies(cookies: AstroCookies) {
  cookies.delete(SESSION_COOKIE_NAME, SESSION_COOKIE_OPTIONS);
  cookies.delete(SIGNED_IN_FLAG_COOKIE_NAME, SIGNED_IN_FLAG_COOKIE_OPTIONS);
}
