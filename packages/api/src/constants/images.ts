export const IMAGE_CONTENT_TYPES = ["image/png", "image/jpeg", "image/webp"] as const;

export type ImageContentType = (typeof IMAGE_CONTENT_TYPES)[number];
export type ImageFileExtension = "png" | "jpg" | "webp";

export const IMAGE_FILE_EXTENSIONS: Record<ImageContentType, ImageFileExtension> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
} as const;
