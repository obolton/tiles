import { SIGNED_IN_FLAG_COOKIE_NAME } from "api/src/constants/cookies";
import client from "@/api/client";
import { getCookie } from "./cookies";
import { clear, setPersistent, removePersistent, getPersistent } from "./state";

export function isSignedIn() {
  return getCookie(document.cookie, SIGNED_IN_FLAG_COOKIE_NAME) === "1";
}

export async function getUserInfo() {
  const user = await client.auth.getUserInfo.query();
  if (user) {
    setUserInfo(user);
  } else {
    removePersistent("user");
    throw new Error("User not found");
  }
  return user;
}

export function setUserInfo(user: {
  id: string;
  username: string | null;
  name: string;
  email: string;
  imageUrl: string | null;
}) {
  setPersistent("user", {
    ...user,
    profile: user.username
      ? `/profiles/@${user.username}`
      : `/profiles/${user.id}`,
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
