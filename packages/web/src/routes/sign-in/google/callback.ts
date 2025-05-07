import {
  getOAuth2StateCookie,
  getOAuth2DestinationCookie,
  clearOAuth2Cookies,
} from "@/auth/oauth2";
import { redirect, forbidden, serverError } from "@/router/router";
import { getAccessToken, getGoogleUser } from "@/auth/google";
import { validateDestination } from "@/auth/destinations";
import { signIn, setAuthenticationCookies } from "@/auth/sessions";
import type { APIRoute, APIRequestHandler } from "@/router/router";

export const GET: APIRequestHandler = async ({ url, headers }) => {
  const cookies = headers.get("cookie") ?? "";
  const stateCookieValue = getOAuth2StateCookie(cookies);
  const destinationCookieValue = getOAuth2DestinationCookie(cookies);
  const cookiesToSet = clearOAuth2Cookies();

  if (destinationCookieValue && !validateDestination(destinationCookieValue)) {
    return forbidden(cookiesToSet);
  }

  const searchParams = url.searchParams;

  const state = searchParams.get("state");
  const code = searchParams.get("code");
  const error = searchParams.get("error");

  if (error) {
    return serverError(error, cookiesToSet);
  }

  if (!stateCookieValue || !state || stateCookieValue !== state || !code) {
    return forbidden(cookiesToSet);
  }

  const accessToken = await getAccessToken(code);
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

  return redirect(`/${destinationCookieValue || ""}`, 302, [
    ...cookiesToSet,
    ...authenticationCookies,
  ]);
};

export default {
  get: GET,
} satisfies APIRoute;
