import {
  SIGNED_IN_FLAG_COOKIE_NAME,
  SESSION_COOKIE_NAME,
} from "api/src/constants/cookies";
import client from "@/api/client";
import { getCookie } from "./cookies";
import { clear, setPersistent, removePersistent, getPersistent } from "./state";
import { Store } from "./stores";

export interface User {
  id: string;
  username: string | null;
  name: string;
  imageUrl: string | null;
}

export const user = new Store<User | null>(null);

export function getSessionId(headers: Headers) {
  return getCookie(headers.get("cookie") ?? "", SESSION_COOKIE_NAME);
}

export function isSignedIn() {
  return getCookie(document.cookie, SIGNED_IN_FLAG_COOKIE_NAME) === "1";
}

export async function getUserInfo() {
  const userInfo = await client.auth.getUserInfo.query();
  if (userInfo) {
    setUserInfo(userInfo);
  } else {
    removePersistent("user");
    throw new Error("User not found");
  }
  return user;
}

export function setUserInfo(userInfo: User) {
  user.value = userInfo;
  setPersistent("user", {
    ...user,
    profile: userInfo.username
      ? `/profiles/@${userInfo.username}`
      : `/profiles/${userInfo.id}`,
  });
}

export function getCachedUserInfo() {
  return getPersistent<{
    id: string;
    username: string | null;
    name: string;
    imageUrl: string;
    profile: string;
  }>("user");
}

export function clearAuthenticationCookies() {
  document.cookie = `${SIGNED_IN_FLAG_COOKIE_NAME}=; Path=/; Secure; SameSite=Lax; Max-Age=0`;
}

export async function signOut() {
  await client.auth.signOut.mutate();
  clearAuthenticationCookies();
  clear();
}
