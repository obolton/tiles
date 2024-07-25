import { SIGNED_IN_FLAG_COOKIE_NAME } from "api/src/constants/cookies";
import { getCookie } from "./cookies";
import client from "../api/client";
import { setPersistent, removePersistent, getPersistent } from "./state";

export function isSignedIn() {
  return getCookie(SIGNED_IN_FLAG_COOKIE_NAME) === "1";
}

export async function getUserInfo() {
  const user = await client.auth.getUserInfo.query();
  if (user) {
    setPersistent("user", user);
  } else {
    removePersistent("user");
    throw new Error("User not found");
  }
  return user;
}

export function getCachedUserInfo() {
  const user = getPersistent<{ id: string; name: string; imageUrl: string }>(
    "user",
  );
  if (!user) {
    return null;
  }
  return user;
}
