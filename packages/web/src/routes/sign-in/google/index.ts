import { redirect } from "@/router/responses";
import { setOAuth2Cookies, getOAuthOriginRedirect } from "@/auth/oauth2";
import { getGoogleAuthorizationUrl } from "@/auth/google";
import type { APIRoute, APIRequestHandler } from "@/router/router";

function getDevOrigin(referer: string | null): string | undefined {
  if (!referer) {
    return undefined;
  }
  try {
    const url = new URL(referer);
    if (url.hostname.endsWith(".tiles.test")) {
      return url.origin;
    }
  } catch {
    // Invalid URL
  }
  return undefined;
}

export const GET: APIRequestHandler = ({ url, headers }) => {
  if (import.meta.env.DEV) {
    const oauthRedirect = getOAuthOriginRedirect(url);
    if (oauthRedirect) {
      return redirect(oauthRedirect, 302);
    }
  }

  const destination = url.searchParams.get("destination");
  const origin = import.meta.env.DEV
    ? getDevOrigin(headers.get("referer"))
    : undefined;
  const {
    url: redirectUrl,
    state,
    verifier,
    nonce,
  } = getGoogleAuthorizationUrl();
  return redirect(
    redirectUrl,
    302,
    setOAuth2Cookies({
      state,
      verifier,
      nonce,
      destination: destination || "",
      origin,
    }),
  );
};

export default {
  get: GET,
} satisfies APIRoute;
