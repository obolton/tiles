import { redirect } from "@/router/responses";
import { setOAuth2Cookies } from "@/auth/oauth2";
import { getGoogleAuthorizationUrl } from "@/auth/google";
import { getDestination } from "@/auth/destinations";
import type { APIRoute, APIRequestHandler } from "@/router/router";

export const GET: APIRequestHandler = ({ url }) => {
  const destination = getDestination(url);
  const { url: googleUrl, state, verifier, nonce } = getGoogleAuthorizationUrl();
  return redirect(
    googleUrl,
    302,
    setOAuth2Cookies({
      state,
      verifier,
      nonce,
      destination: destination ?? "",
    }),
  );
};

export default {
  get: GET,
} satisfies APIRoute;
