import type { APIRoute } from "astro";
import { setOAuth2StateCookie } from "@/auth/oauth2";
import { getGoogleAuthorizationUrl } from "@/auth/google";

export const GET: APIRoute = ({ cookies, redirect }) => {
  const { url, state } = getGoogleAuthorizationUrl();
  setOAuth2StateCookie(cookies, state);
  return redirect(url, 302);
};
