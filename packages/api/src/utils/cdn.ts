export function getProfileImageUrl(imageKey: string) {
  return `${process.env.PROFILE_IMAGES_BASE_URL}/${imageKey}`;
}
