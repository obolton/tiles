import { env } from "@/env";
import { purgeCache } from "./cloudflare";

export function getProfileImageUrl(imageKey: string) {
  return `${env.PROFILE_IMAGES_BASE_URL}/${imageKey}?optimizer=image&class=small`;
}

export function getHomePageUrl() {
  return `${env.CLIENT_ORIGIN}/`;
}

export function getPageUrl(pageId: string) {
  return `${env.CLIENT_ORIGIN}/pages/${pageId}`;
}

export function invalidateCachedUrls(urls: string[]) {
  if (env.NODE_ENV !== "production" || urls.length === 0) {
    return;
  }

  purgeCache({ files: urls }).catch((error: unknown) =>
    console.error("Failed to invalidate cached URLs:", urls, error),
  );
}

export function invalidateCachedPages(ids: string[]) {
  const urls = ids.map(getPageUrl);
  if (ids.includes(env.PAGE_ID)) {
    urls.push(getHomePageUrl());
  }
  invalidateCachedUrls(urls);
}
