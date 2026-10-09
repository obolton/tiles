import { imageDimensionsFromStream } from "image-dimensions";
import type { Client } from "./client";
import { BadRequestError, UnsupportedMediaTypeError } from "./errors";
import { CONTENT_TYPES, IMAGE_TYPES } from "./images";
import type { UploadParams } from "./requests";

export interface UploadResult {
  id: string;
  width: number;
  height: number;
}

/**
 * Uploads an image to R2 and creates a database record.
 */
export async function uploadImage(
  params: UploadParams,
  body: ReadableStream<Uint8Array> | null,
  client: Client,
  bucket: R2Bucket,
): Promise<UploadResult> {
  if (!body) {
    throw new BadRequestError("Request body is required");
  }

  const { workspaceId, purpose, type } = params;

  // Create pending database record
  const image = await client.media.createImage.mutate({
    workspaceId,
    source: "UPLOAD",
    purpose,
    type,
    pending: true,
  });

  // Stream to R2 and extract dimensions
  let object: R2Object | undefined;
  try {
    const [uploadStream, dimensionsStream] = body.tee();

    let dimensions: { width: number; height: number; type: string } | undefined;
    [object, dimensions] = await Promise.all([
      bucket.put(image.id, uploadStream, {
        httpMetadata: { contentType: CONTENT_TYPES[type] },
        customMetadata: {
          workspace: image.workspaceId,
          user: image.userId,
        },
      }),
      imageDimensionsFromStream(dimensionsStream),
    ]);

    if (!dimensions) {
      throw new BadRequestError("Could not read image dimensions");
    }

    const detectedType = IMAGE_TYPES[dimensions.type];
    if (detectedType !== type) {
      throw new UnsupportedMediaTypeError();
    }

    // Update database record
    const updated = await client.media.updateImage.mutate({
      id: image.id,
      workspaceId,
      pending: false,
      bytes: object.size,
      width: dimensions.width,
      height: dimensions.height,
    });

    return {
      id: updated.id,
      width: dimensions.width,
      height: dimensions.height,
    };
  } catch (error) {
    // Roll back
    if (object) {
      await bucket.delete(image.id);
    }
    await client.media.deleteImage.mutate({ id: image.id, workspaceId });
    throw error;
  }
}
