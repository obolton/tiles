import { SIGNED_IN_FLAG_COOKIE_NAME, SESSION_COOKIE_NAME } from "api/constants/cookies";
import client from "@/api/client";
import { publicEnv } from "@/env/public";
import { getCookie } from "./cookies";
import { navigate } from "./navigation";
import { reactive } from "reactivity";
import type { AppRouterOutputs } from "@/api/client";

export type User = AppRouterOutputs["users"]["getUserInfo"];

export const user = reactive<User | null>(null);

export function getSessionId(headers: Headers) {
  return getCookie(headers.get("cookie") ?? "", SESSION_COOKIE_NAME);
}

export function isSignedIn() {
  return getCookie(document.cookie, SIGNED_IN_FLAG_COOKIE_NAME) === "1";
}

function cacheUser(value: User | null) {
  try {
    if (value) {
      localStorage.setItem("user", JSON.stringify(value));
    } else {
      localStorage.removeItem("user");
    }
  } catch {
    // Storage unavailable
  }
}

function getCachedUser(): User | null {
  try {
    const data = localStorage.getItem("user");
    return data !== null ? (JSON.parse(data) as User) : null;
  } catch {
    return null;
  }
}

export async function getUserInfo() {
  try {
    const userInfo = await client.users.getUserInfo.query();
    user.value = userInfo;
    cacheUser(userInfo);
  } catch (error) {
    user.value = null;
    cacheUser(null);
    throw error;
  }
}

export function initializeSession(userData?: User | null) {
  if (userData) {
    user.value = userData;
    cacheUser(userData);
    return;
  }

  if (!isSignedIn()) {
    return;
  }

  const cached = getCachedUser();
  if (cached) {
    user.value = cached;
  }

  // Background refresh — updates user.value reactively when resolved
  getUserInfo().catch((error: unknown) => {
    if (import.meta.env.DEV) {
      console.error("Failed to refresh user info", error);
    }
  });
}

export async function signOut() {
  await client.auth.signOut.mutate();
  document.cookie = `${SIGNED_IN_FLAG_COOKIE_NAME}=; Path=/; Secure; SameSite=Lax; Domain=${publicEnv.PUBLIC_SESSION_COOKIE_DOMAIN}; Max-Age=0`;
  sessionStorage.clear();
  localStorage.clear();
  navigate("/", { replace: true });
}
