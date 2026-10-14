import { randomUUID } from "node:crypto";
import prisma from "@/database/prisma";
import { upload, IMAGES_BUCKET } from "@/utils/storage";
import { matchContentType } from "@/utils/linkMetadata";
import { safeFetch } from "@/utils/safeFetch";
import { guardImageStream } from "@/utils/imageStream";
import type { ImageType } from "@/generated/prisma/client";

const FETCH_TIMEOUT_MS = 10000;
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

const IMAGE_CONTENT_TYPES: Record<string, ImageType> = {
  "image/jpeg": "JPEG",
  "image/png": "PNG",
  "image/gif": "GIF",
  "image/webp": "WEBP",
};

const ALLOWED_CONTENT_TYPES = Object.keys(IMAGE_CONTENT_TYPES);

/**
 * Fetches an image from an external URL, uploads it to R2,
 * and creates an Image record in the database.
 *
 * Private and internal destinations are rejected, the download is capped at
 * MAX_FILE_SIZE and the bytes must match the declared image type.
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
    const response = await safeFetch(url, {
      headers: {
        Accept: ALLOWED_CONTENT_TYPES.join(", "),
        "User-Agent": "facebookexternalhit/1.1",
      },
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
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

    await upload(IMAGES_BUCKET, imageId, guardImageStream(body, mimeType, MAX_FILE_SIZE), mimeType);

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
