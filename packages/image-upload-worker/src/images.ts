export type ImageType = "PNG" | "JPEG" | "GIF" | "WEBP";

export const IMAGE_TYPES: Record<string, ImageType> = {
  png: "PNG",
  jpeg: "JPEG",
  gif: "GIF",
  webp: "WEBP",
};

/**
 * Parses a Content-Type header value into an ImageType.
 * Expects a MIME type like "image/png" or "image/jpeg".
 * Returns undefined if the content type is missing or unsupported.
 */
export function parseContentType(contentType: string | null): ImageType | undefined {
  const subtype = contentType?.toLowerCase().split("/")[1];
  if (!subtype) {
    return undefined;
  }
  return IMAGE_TYPES[subtype];
}
