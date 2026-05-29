const IMAGES_BASE_URL = import.meta.env.PUBLIC_IMAGES_BASE_URL;

if (!IMAGES_BASE_URL) {
  throw new Error("PUBLIC_IMAGES_BASE_URL is not set");
}

/**
 * Returns the CDN URL for an image given its ID.
 */
export function getImageUrl(imageId: string): string {
  return `${IMAGES_BASE_URL}/${imageId}?optimizer=image&class=large`;
}
