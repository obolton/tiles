const IMAGES_BASE_URL = import.meta.env.PUBLIC_IMAGES_BASE_URL;

if (!IMAGES_BASE_URL) {
  throw new Error("PUBLIC_IMAGES_BASE_URL is not set");
}

const PROFILE_IMAGES_BASE_URL = import.meta.env.PUBLIC_PROFILE_IMAGES_BASE_URL;

if (!PROFILE_IMAGES_BASE_URL) {
  throw new Error("PUBLIC_PROFILE_IMAGES_BASE_URL is not set");
}

/**
 * Returns the CDN URL for an image given its ID.
 */
export function getImageUrl(imageId: string): string {
  return `${IMAGES_BASE_URL}/${imageId}?optimizer=image&class=large`;
}

/**
 * Returns the CDN URL for a profile image given its image key.
 */
export function getProfileImageUrl(imageKey: string): string {
  return `${PROFILE_IMAGES_BASE_URL}/${imageKey}?optimizer=image&class=small`;
}
