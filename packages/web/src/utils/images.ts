import { publicEnv } from "@/env/public";

/**
 * Returns the CDN URL for an image given its ID.
 */
export function getImageUrl(imageId: string): string {
  return `${publicEnv.PUBLIC_IMAGES_BASE_URL}/${imageId}?optimizer=image&class=large`;
}

/**
 * Returns the CDN URL for a profile image given its image key.
 */
export function getProfileImageUrl(imageKey: string): string {
  return `${publicEnv.PUBLIC_PROFILE_IMAGES_BASE_URL}/${imageKey}?optimizer=image&class=small`;
}
