import cloudflare, { CLOUDFLARE_ZONE_ID } from "./cloudflare.ts";

const HOME_PAGE_ID = process.env.PAGE_ID;

export function getProfileImageUrl(imageKey: string) {
  return `${process.env.PROFILE_IMAGES_BASE_URL}/${imageKey}?optimizer=image&class=small`;
}

export function getImageUrl(imageKey: string) {
  return `${process.env.IMAGES_BASE_URL}/${imageKey}?optimizer=image&class=large`;
}

export function getLinkImageUrl(tileId: string) {
  return `${process.env.RESOURCES_BASE_URL}/links/${tileId}`;
}

export function getVideoImageUrl(tileId: string) {
  return `${process.env.RESOURCES_BASE_URL}/videos/${tileId}`;
}

export function getHomePageUrl() {
  return `${process.env.CLIENT_ORIGIN}/`;
}

export function getPageUrl(pageId: string) {
  return `${process.env.CLIENT_ORIGIN}/pages/${pageId}`;
}

export function getProfilePageUrl(userId: string) {
  return `${process.env.CLIENT_ORIGIN}/profiles/${userId}`;
}

export function invalidateCachedUrl(url: string) {
  if (process.env.NODE_ENV !== "production") {
    return;
  }

  cloudflare.cache
    .purge({
      zone_id: CLOUDFLARE_ZONE_ID,
      files: [url],
    })
    .catch((error) =>
      console.error("Failed to invalidate cached URL:", url, error),
    );
}

export function invalidateCachedPage(id: string) {
  invalidateCachedUrl(getPageUrl(id));
  if (id === HOME_PAGE_ID) {
    invalidateCachedUrl(getHomePageUrl());
  }
}
