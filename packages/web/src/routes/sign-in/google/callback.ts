import {
  getOAuth2Cookies,
  getOAuthOriginRedirect,
  clearOAuth2Cookies,
  compareOAuth2State,
} from "@/auth/oauth2";
import { redirect, forbidden } from "@/router/responses";
import { exchangeCode, verifyIdToken } from "@/auth/google";
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
  const cookies = getOAuth2Cookies(headers.get("cookie") ?? "");
  const cookiesToSet = clearOAuth2Cookies();

  if (cookies.destination && !validateDestination(cookies.destination)) {
    return forbidden(cookiesToSet);
  }

  const searchParams = url.searchParams;

  const state = searchParams.get("state");
  const code = searchParams.get("code");
  const error = searchParams.get("error");

  if (error) {
    console.error("OAuth error from Google:", error);
    const errorCode = error === "access_denied" ? "cancelled" : "failed";
    return redirect(`/sign-in?error=${errorCode}`, 302, cookiesToSet);
  }

  if (
    !cookies.state ||
    !cookies.verifier ||
    !cookies.nonce ||
    !state ||
    !compareOAuth2State(cookies.state, state) ||
    !code
  ) {
    return forbidden(cookiesToSet);
  }

  const { idToken } = await exchangeCode({
    code,
    codeVerifier: cookies.verifier,
  });
  const googleUser = await verifyIdToken({
    idToken,
    expectedNonce: cookies.nonce,
  });
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

  const destination = `/${cookies.destination ?? ""}`;
  const redirectUrl =
    import.meta.env.DEV && cookies.origin
      ? `${cookies.origin}${destination}`
      : destination;

  return redirect(redirectUrl, 302, [
    ...cookiesToSet,
    ...authenticationCookies,
  ]);
};

export default {
  get: GET,
} satisfies APIRoute;
