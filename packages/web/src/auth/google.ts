import assert from "node:assert";
import { getOAuth2AuthorizationUrl, getOAuth2AccessToken } from "./oauth2";

const AUTHORIZATION_ENDPOINT = "https://accounts.google.com/o/oauth2/v2/auth";
const TOKEN_ENDPOINT = "https://oauth2.googleapis.com/token";
const USER_INFO_ENDPOINT = "https://www.googleapis.com/oauth2/v2/userinfo";
const SCOPES = [
  "https://www.googleapis.com/auth/userinfo.profile",
  "https://www.googleapis.com/auth/userinfo.email",
];

const GOOGLE_CLIENT_ID: string = import.meta.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET: string = import.meta.env.GOOGLE_CLIENT_SECRET;
const GOOGLE_REDIRECT_URI: string = import.meta.env.GOOGLE_REDIRECT_URI;
assert(GOOGLE_CLIENT_ID);
assert(GOOGLE_CLIENT_SECRET);
assert(GOOGLE_REDIRECT_URI);

export function getGoogleAuthorizationUrl() {
  return getOAuth2AuthorizationUrl({
    endpoint: AUTHORIZATION_ENDPOINT,
    clientId: GOOGLE_CLIENT_ID,
    redirectUri: GOOGLE_REDIRECT_URI,
    scope: SCOPES,
    otherAttributes: {
      access_type: "online",
      include_granted_scopes: "false",
    },
  });
}

export async function googleApiRequest<T extends object>(
  url: string,
  accessToken: string
): Promise<T> {
  const response = await fetch(url, {
    headers: new Headers({
      Accept: "application/json",
      Authorization: `Bearer ${accessToken}`,
    }),
  });
  if (!response.ok) {
    throw new Error(
      `Google API request error: [${response.status}] ${response.statusText}`
    );
  }
  return response.json() as Promise<T>;
}

export async function getAccessToken(code: string) {
  return getOAuth2AccessToken({
    endpoint: TOKEN_ENDPOINT,
    clientId: GOOGLE_CLIENT_ID,
    clientSecret: GOOGLE_CLIENT_SECRET,
    redirectUri: GOOGLE_REDIRECT_URI,
    code,
  });
}

export async function getGoogleUser(accessToken: string) {
  const googleUser = await googleApiRequest<{
    id: string;
    name: string;
    given_name: string;
    family_name: string;
    email: string;
    verified_email: boolean;
    picture: string;
    hd?: string;
  }>(USER_INFO_ENDPOINT, accessToken);
  // TODO: Validate the response
  return {
    id: googleUser.id,
    name: googleUser.name,
    email: googleUser.email,
    emailVerified: googleUser.verified_email,
    imageUrl: googleUser.picture,
  };
}
