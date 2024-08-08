export function getProfileImageUrl(imageKey: string) {
  return `${process.env.PROFILE_IMAGES_BASE_URL}/${imageKey}`;
}

export function getLinkImageUrl(tileId: string) {
  return `${process.env.RESOURCES_BASE_URL}/links/${tileId}`;
}

export function getVideoImageUrl(tileId: string) {
  return `${process.env.RESOURCES_BASE_URL}/videos/${tileId}`;
}
