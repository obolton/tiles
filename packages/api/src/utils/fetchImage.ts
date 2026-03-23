import { randomUUID } from "node:crypto";
import prisma from "@/database/prisma";
import { upload, IMAGES_BUCKET } from "@/utils/storage";
import { matchContentType } from "@/utils/linkMetadata";
import type { ImageType } from "@/generated/prisma/client";

// TODO: Validate uploaded images match the reported Content-Type.

const FETCH_TIMEOUT_MS = 10000;
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

const IMAGE_CONTENT_TYPES: Record<string, ImageType> = {
  "image/jpeg": "JPEG",
  "image/png": "PNG",
  "image/gif": "GIF",
  "image/webp": "WEBP",
};

const ALLOWED_CONTENT_TYPES = Object.keys(IMAGE_CONTENT_TYPES);

function validateUrl(url: string): void {
  const parsed = new URL(url);
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error(`Disallowed protocol: ${parsed.protocol}`);
  }
}

/**
 * Fetches an image from an external URL, uploads it to R2,
 * and creates an Image record in the database.
 *
 * Returns the image ID, or null if the fetch fails for any reason.
 * Failures are logged but never propagated — link creation must not
 * be blocked by image download issues.
 */
export async function fetchImage(
  url: string,
  workspaceId: string,
  userId: string,
): Promise<string | null> {
  try {
    validateUrl(url);

    const response = await fetch(url, {
      headers: {
        Accept: ALLOWED_CONTENT_TYPES.join(", "),
        "User-Agent": "facebookexternalhit/1.1",
      },
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      redirect: "follow",
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status} ${response.statusText}`);
    }

    const contentType = response.headers.get("Content-Type");
    if (!contentType || !matchContentType(contentType, ALLOWED_CONTENT_TYPES)) {
      throw new Error(`Invalid content type: ${contentType}`);
    }

    const contentLength = response.headers.get("Content-Length");
    if (contentLength && parseInt(contentLength, 10) > MAX_FILE_SIZE) {
      throw new Error(`Image too large: ${contentLength} bytes`);
    }

    const body = response.body;
    if (!body) {
      throw new Error("No response body");
    }

    const mimeType = contentType.split(";")[0]!.trim().toLowerCase();
    const imageType = IMAGE_CONTENT_TYPES[mimeType];
    if (!imageType) {
      throw new Error(`Unsupported image type: ${mimeType}`);
    }

    const imageId = randomUUID();

    await upload(IMAGES_BUCKET, imageId, body, mimeType);

    await prisma.image.create({
      data: {
        id: imageId,
        workspaceId,
        userId,
        source: "EXTERNAL_LINK",
        purpose: "CONTENT",
        type: imageType,
        pending: false,
      },
    });

    return imageId;
  } catch (error) {
    console.error(`Failed to fetch image from ${url}:`, error);
    return null;
  }
}
