import { getOAuth2Cookies, clearOAuth2Cookies, compareOAuth2State } from "@/auth/oauth2";
import { redirect, forbidden } from "@/router/responses";
import { exchangeCode, verifyIdToken } from "@/auth/google";
import { validateDestination } from "@/auth/destinations";
import { signIn, setAuthenticationCookies } from "@/auth/sessions";
import type { APIRoute, APIRequestHandler } from "@/router/router";

function getSignInErrorUrl(error: "cancelled" | "failed", destination: string | null) {
  const params = new URLSearchParams({ error });
  if (destination) {
    params.set("destination", destination);
  }
  return `/sign-in?${params}`;
}

export const GET: APIRequestHandler = async ({ url, headers }) => {
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
    return redirect(getSignInErrorUrl(errorCode, cookies.destination), 302, cookiesToSet);
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

  let session;
  try {
    const { idToken } = await exchangeCode({
      code,
      codeVerifier: cookies.verifier,
    });
    const googleUser = await verifyIdToken({
      idToken,
      expectedNonce: cookies.nonce,
    });
    session = await signIn({
      provider: "GOOGLE",
      providerId: googleUser.id,
      name: googleUser.name,
      email: googleUser.email,
      emailVerified: googleUser.emailVerified,
      imageUrl: googleUser.imageUrl,
    });
  } catch (error) {
    console.error("Sign-in failed:", error);
    return redirect(getSignInErrorUrl("failed", cookies.destination), 302, cookiesToSet);
  }

  const authenticationCookies = setAuthenticationCookies(session.id, new Date(session.expiresAt));

  const destination = `/${cookies.destination ?? ""}`;

  return redirect(destination, 302, [...cookiesToSet, ...authenticationCookies]);
};

export default {
  get: GET,
} satisfies APIRoute;
