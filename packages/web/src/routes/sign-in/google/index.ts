import { redirect } from "@/router/router";
import {
  setOAuth2StateCookie,
  setOAuth2DestinationCookie,
} from "@/auth/oauth2";
import { getGoogleAuthorizationUrl } from "@/auth/google";
import type { APIRoute, APIRequestHandler } from "@/router/router";

export const GET: APIRequestHandler = ({ url }, response) => {
  const destination = url.searchParams.get("destination");
  const { url: redirectUrl, state } = getGoogleAuthorizationUrl();
  response.setHeader("Set-Cookie", [
    setOAuth2StateCookie(state),
    setOAuth2DestinationCookie(destination || ""),
  ]);
  return redirect(redirectUrl, 302);
};

export default {
  get: GET,
} satisfies APIRoute;
