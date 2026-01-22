import { redirect, badRequest } from "@/router/responses";
import { setOAuth2StateCookies } from "@/auth/oauth2";
import { getGoogleAuthorizationUrl } from "@/auth/google";
import { validateDestination } from "@/auth/destinations";
import type { APIRoute, APIRequestHandler } from "@/router/router";

export const GET: APIRequestHandler = ({ url }) => {
  // Support both relative paths (destination) and full URLs (origin)
  // origin is used for multi-instance local dev where OAuth callback
  // needs to redirect back to a different subdomain
  const origin = url.searchParams.get("origin");
  const destination = url.searchParams.get("destination");

  const redirectDestination = origin || destination || "";

  // Validate the destination to prevent open redirect attacks
  if (redirectDestination && !validateDestination(redirectDestination)) {
    return badRequest("Invalid redirect destination");
  }

  const { url: redirectUrl, state } = getGoogleAuthorizationUrl();
  return redirect(
    redirectUrl,
    302,
    setOAuth2StateCookies(state, redirectDestination),
  );
};

export default {
  get: GET,
} satisfies APIRoute;
