import { redirect } from "@/router/router";
import { setOAuth2StateCookies } from "@/auth/oauth2";
import { getGoogleAuthorizationUrl } from "@/auth/google";
import type { APIRoute, APIRequestHandler } from "@/router/router";

export const GET: APIRequestHandler = ({ url }) => {
  const destination = url.searchParams.get("destination");
  const { url: redirectUrl, state } = getGoogleAuthorizationUrl();
  return redirect(
    redirectUrl,
    302,
    setOAuth2StateCookies(state, destination || ""),
  );
};

export default {
  get: GET,
} satisfies APIRoute;
