import client from "../api/client";
import { SESSION_COOKIE_NAME, SIGNED_IN_FLAG_COOKIE_NAME } from "./constants";
import type { AuthenticationProvider } from "@prisma/client";
import type { AstroCookies, AstroCookieSetOptions } from "astro";

const SESSION_COOKIE_OPTIONS: AstroCookieSetOptions = {
  httpOnly: true,
  secure: true,
  path: "/",
  sameSite: "strict",
};

const SIGNED_IN_FLAG_COOKIE_OPTIONS: AstroCookieSetOptions = {
  httpOnly: false,
  secure: true,
  path: "/",
  sameSite: "strict",
};

type SignInOptions = {
  provider: AuthenticationProvider;
  providerId: string;
  name: string;
  email: string;
  emailVerified: boolean;
};

export async function signIn({
  provider,
  providerId,
  name,
  email,
  emailVerified,
}: SignInOptions) {
  return client.auth.signIn.mutate({
    provider,
    providerId,
    name,
    email,
    emailVerified,
  });
}

export function setAuthenticationCookies(
  cookies: AstroCookies,
  sessionId: string,
  expiresAt: Date
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
