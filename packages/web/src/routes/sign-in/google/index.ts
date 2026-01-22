import { redirect, badRequest } from "@/router/responses";
import { setOAuth2StateCookies } from "@/auth/oauth2";
import { getGoogleAuthorizationUrl } from "@/auth/google";
import { validateDestination } from "@/auth/destinations";
import type { APIRoute, APIRequestHandler } from "@/router/router";

export const GET: APIRequestHandler = ({ url }) => {
  const destination = url.searchParams.get("destination") ?? "";

  if (destination && !validateDestination(destination)) {
    return badRequest("Invalid redirect destination");
  }

  const { url: redirectUrl, state } = getGoogleAuthorizationUrl();
  return redirect(redirectUrl, 302, setOAuth2StateCookies(state, destination));
};

export default {
  get: GET,
} satisfies APIRoute;
