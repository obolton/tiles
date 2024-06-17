import {
  getOAuth2StateCookie,
  clearOAuth2StateCookie,
} from "../../../auth/oauth2";
import { getAccessToken, getGoogleUser } from "../../../auth/google";
import { signIn, setAuthenticationCookies } from "../../../auth/sessions";
import type { APIRoute } from "astro";

export const GET: APIRoute = async ({ cookies, redirect, request }) => {
  const stateCookieValue = getOAuth2StateCookie(cookies);
  const searchParams = new URL(request.url).searchParams;

  const state = searchParams.get("state");
  const code = searchParams.get("code");
  const error = searchParams.get("error");

  if (error) {
    return new Response(`Error: ${error}`, { status: 500 });
  }

  if (!stateCookieValue || !state || stateCookieValue !== state || !code) {
    return new Response(null, { status: 403, statusText: "Forbidden" });
  }

  clearOAuth2StateCookie(cookies);

  const accessToken = await getAccessToken(code);
  const googleUser = await getGoogleUser(accessToken);
  const session = await signIn({
    provider: "GOOGLE",
    providerId: googleUser.id,
    name: googleUser.name,
    email: googleUser.email,
    emailVerified: googleUser.emailIsVerified,
  });
  setAuthenticationCookies(cookies, session.id, new Date(session.expiresAt));

  return redirect("/", 302);
};
