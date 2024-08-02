export function getProfileImageUrl(imageKey: string) {
  return `${process.env.PROFILE_IMAGES_BASE_URL}/${imageKey}`;
}

export function getLinkImageUrl(tileId: string) {
  return `${process.env.LINK_IMAGES_BASE_URL}/${tileId}`;
}
