import { SIGNED_IN_FLAG_COOKIE_NAME } from "../auth/constants";
import { getCookie } from "./cookies";
import client from "../api/client";
import { set, remove, has } from "./state";

export function isSignedIn() {
  return getCookie(SIGNED_IN_FLAG_COOKIE_NAME) === "1";
}

export function hasUserInfo() {
  return has("userId");
}

export async function getUserInfo() {
  const user = await client.auth.getUserInfo.query();
  if (user) {
    set("userId", user.id);
    set("userName", user.name);
  } else {
    remove("userId");
    remove("userName");
  }
}
