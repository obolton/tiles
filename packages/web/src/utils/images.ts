export function getImageUrl(key: string) {
  return `${import.meta.env.PUBLIC_IMAGES_BASE_URL}/${key}?optimizer=image&class=large`;
}
