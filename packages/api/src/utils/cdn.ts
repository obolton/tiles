import cloudflare, { CLOUDFLARE_ZONE_ID } from "./cloudflare.ts";

const HOME_PAGE_ID = process.env.PAGE_ID;

export function getProfileImageUrl(imageKey: string) {
  return `${process.env.PROFILE_IMAGES_BASE_URL}/${imageKey}?optimizer=image&class=small`;
}

export function getHomePageUrl() {
  return `${process.env.CLIENT_ORIGIN}/`;
}

export function getPageUrl(pageId: string) {
  return `${process.env.CLIENT_ORIGIN}/pages/${pageId}`;
}

export function invalidateCachedUrls(urls: string[]) {
  if (process.env.NODE_ENV !== "production" || urls.length === 0) {
    return;
  }

  cloudflare.cache
    .purge({
      zone_id: CLOUDFLARE_ZONE_ID,
      files: urls,
    })
    .catch((error) =>
      console.error("Failed to invalidate cached URLs:", urls, error),
    );
}

export function invalidateCachedPages(ids: string[]) {
  const urls = ids.map(getPageUrl);
  if (HOME_PAGE_ID && ids.includes(HOME_PAGE_ID)) {
    urls.push(getHomePageUrl());
  }
  invalidateCachedUrls(urls);
}
