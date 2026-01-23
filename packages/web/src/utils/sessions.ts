import {
  SIGNED_IN_FLAG_COOKIE_NAME,
  SESSION_COOKIE_NAME,
} from "api/constants/cookies";
import client from "@/api/client";
import { getCookie } from "./cookies";
import { clear, setPersistent, removePersistent, getPersistent } from "./state";
import { reactive } from "./reactivity";
import type { AppRouterOutputs } from "@/api/client";

const SESSION_COOKIE_DOMAIN = import.meta.env.PUBLIC_SESSION_COOKIE_DOMAIN;

export type User = AppRouterOutputs["users"]["getUserInfo"];

export const user = reactive<User | null>(null);

export function getSessionId(headers: Headers) {
  return getCookie(headers.get("cookie") ?? "", SESSION_COOKIE_NAME);
}

export function isSignedIn() {
  return getCookie(document.cookie, SIGNED_IN_FLAG_COOKIE_NAME) === "1";
}

export async function getUserInfo() {
  try {
    const userInfo = await client.users.getUserInfo.query();
    user.value = userInfo;
    setPersistent("user", userInfo);
    return user;
  } catch (error) {
    user.value = null;
    removePersistent("user");
    throw error;
  }
}

export function getCachedUserInfo() {
  return getPersistent<User>("user");
}

export function clearAuthenticationCookies() {
  document.cookie = `${SIGNED_IN_FLAG_COOKIE_NAME}=; Path=/; Secure; SameSite=Lax; Domain=${SESSION_COOKIE_DOMAIN}; Max-Age=0`;
}

export async function signOut() {
  await client.auth.signOut.mutate();
  clearAuthenticationCookies();
  clear();
  delete document.body.dataset.signedIn;
  window.location.href = "/";
}
