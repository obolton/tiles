export const IMAGE_CONTENT_TYPES = ["image/png", "image/jpeg"] as const;

export type ImageContentType = (typeof IMAGE_CONTENT_TYPES)[number];
export type ImageFileExtension = "png" | "jpg";

export const IMAGE_FILE_EXTENSIONS: Record<
  ImageContentType,
  ImageFileExtension
> = {
  "image/png": "png",
  "image/jpeg": "jpg",
} as const;
