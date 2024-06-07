export function getImageUrl(key: string) {
  return `${import.meta.env.PUBLIC_IMAGES_BASE_URL}/${key}?class=thumbnail`;
}

export function getMapImageUrl(key: string) {
  return `${import.meta.env.PUBLIC_MAPS_BASE_URL}/${key}`;
}
