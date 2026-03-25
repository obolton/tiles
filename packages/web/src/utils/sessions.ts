import {
  SIGNED_IN_FLAG_COOKIE_NAME,
  SESSION_COOKIE_NAME,
} from "api/constants/cookies";
import client from "@/api/client";
import { getCookie } from "./cookies";
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
    try {
      localStorage.setItem("user", JSON.stringify(userInfo));
    } catch {
      // Storage unavailable
    }
    return user;
  } catch (error) {
    user.value = null;
    try {
      localStorage.removeItem("user");
    } catch {
      // Storage unavailable
    }
    throw error;
  }
}

export function getCachedUserInfo(): User | null {
  try {
    const data = localStorage.getItem("user");
    return data !== null ? (JSON.parse(data) as User) : null;
  } catch {
    return null;
  }
}

export function clearAuthenticationCookies() {
  document.cookie = `${SIGNED_IN_FLAG_COOKIE_NAME}=; Path=/; Secure; SameSite=Lax; Domain=${SESSION_COOKIE_DOMAIN}; Max-Age=0`;
}

export function initializeSession(userData?: User | null): User | null {
  if (userData) {
    user.value = userData;
    document.body.dataset.signedIn = "true";
    try {
      localStorage.setItem("user", JSON.stringify(userData));
    } catch {
      // Storage unavailable
    }
    return userData;
  }

  if (!isSignedIn()) {
    return null;
  }

  document.body.dataset.signedIn = "true";

  const cached = getCachedUserInfo();
  if (cached) {
    user.value = cached;
  }

  // Background refresh — updates user.value reactively when resolved
  getUserInfo().catch((error) => {
    user.value = null;
    if (import.meta.env.DEV) {
      console.error("Failed to refresh user info", error);
    }
  });

  return cached;
}

export async function signOut() {
  await client.auth.signOut.mutate();
  clearAuthenticationCookies();
  sessionStorage.clear();
  localStorage.clear();
  delete document.body.dataset.signedIn;
  window.location.href = "/";
}
