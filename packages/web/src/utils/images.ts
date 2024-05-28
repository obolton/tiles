export function getImageUrl(imageKey: string) {
  return `${
    import.meta.env.PUBLIC_IMAGES_BASE_URL
  }/${imageKey}?class=thumbnail`;
}
