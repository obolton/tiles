import {
  getOAuth2StateCookie,
  getOAuth2VerifierCookie,
  getOAuth2DestinationCookie,
  getOAuth2OriginCookie,
  getOAuthOriginRedirect,
  clearOAuth2Cookies,
  compareOAuth2State,
} from "@/auth/oauth2";
import { redirect, forbidden, internalError } from "@/router/responses";
import { getAccessToken, getGoogleUser } from "@/auth/google";
import { validateDestination } from "@/auth/destinations";
import { signIn, setAuthenticationCookies } from "@/auth/sessions";
import type { APIRoute, APIRequestHandler } from "@/router/router";

export const GET: APIRequestHandler = async ({ url, headers }) => {
  if (import.meta.env.DEV) {
    const oauthRedirect = getOAuthOriginRedirect(url);
    if (oauthRedirect) {
      return redirect(oauthRedirect, 302);
    }
  }
  const cookies = headers.get("cookie") ?? "";
  const stateCookieValue = getOAuth2StateCookie(cookies);
  const verifierCookieValue = getOAuth2VerifierCookie(cookies);
  const destinationCookieValue = getOAuth2DestinationCookie(cookies);
  const originCookieValue = import.meta.env.DEV
    ? getOAuth2OriginCookie(cookies)
    : undefined;
  const cookiesToSet = clearOAuth2Cookies();

  if (destinationCookieValue && !validateDestination(destinationCookieValue)) {
    return forbidden(cookiesToSet);
  }

  const searchParams = url.searchParams;

  const state = searchParams.get("state");
  const code = searchParams.get("code");
  const error = searchParams.get("error");

  if (error) {
    return internalError(error, cookiesToSet);
  }

  if (
    !stateCookieValue ||
    !verifierCookieValue ||
    !state ||
    !compareOAuth2State(stateCookieValue, state) ||
    !code
  ) {
    return forbidden(cookiesToSet);
  }

  const accessToken = await getAccessToken({
    code,
    codeVerifier: verifierCookieValue,
  });
  const googleUser = await getGoogleUser(accessToken);
  const session = await signIn({
    provider: "GOOGLE",
    providerId: googleUser.id,
    name: googleUser.name,
    email: googleUser.email,
    emailVerified: googleUser.emailVerified,
    imageUrl: googleUser.imageUrl,
  });

  const authenticationCookies = setAuthenticationCookies(
    session.id,
    new Date(session.expiresAt),
  );

  const destination = `/${destinationCookieValue || ""}`;
  const redirectUrl = originCookieValue
    ? `${originCookieValue}${destination}`
    : destination;

  return redirect(redirectUrl, 302, [
    ...cookiesToSet,
    ...authenticationCookies,
  ]);
};

export default {
  get: GET,
} satisfies APIRoute;
