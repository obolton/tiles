import type { APIRoute } from "astro";
import {
  setOAuth2StateCookie,
  setOAuth2DestinationCookie,
} from "@/auth/oauth2";
import { getGoogleAuthorizationUrl } from "@/auth/google";

export const GET: APIRoute = ({ cookies, url, redirect }) => {
  const destination = url.searchParams.get("destination");
  const { url: redirectUrl, state } = getGoogleAuthorizationUrl();
  setOAuth2StateCookie(cookies, state);
  setOAuth2DestinationCookie(cookies, destination || "");
  return redirect(redirectUrl, 302);
};
