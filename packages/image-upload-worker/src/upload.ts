import { imageDimensionsFromStream } from "image-dimensions";
import type { Client } from "./client";
import { BadRequestError, InternalServerError, UnsupportedMediaTypeError } from "./errors";
import { IMAGE_TYPES } from "./images";
import type { UploadParams } from "./requests";

export interface UploadResult {
  id: string;
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

  // Step 1: Create database record with pending=true
  const image = await client.media.createImage.mutate({
    workspaceId,
    source: "UPLOAD",
    purpose,
    type,
    pending: true,
  });

  // Step 2: Upload to R2 and extract dimensions concurrently
  const [uploadStream, dimensionsStream] = body.tee();

  let object: R2Object;
  let dimensions: { width: number; height: number; type: string } | undefined;
  try {
    [object, dimensions] = await Promise.all([
      bucket.put(image.id, uploadStream, {
        customMetadata: {
          workspace: image.workspaceId,
          user: image.userId,
        },
      }),
      imageDimensionsFromStream(dimensionsStream),
    ]);
  } catch {
    await client.media.deleteImage.mutate({ id: image.id, workspaceId });
    throw new InternalServerError("Failed to upload file");
  }

  if (!dimensions) {
    await bucket.delete(image.id);
    await client.media.deleteImage.mutate({ id: image.id, workspaceId });
    throw new BadRequestError("Could not read image dimensions");
  }

  // Validate that the detected image type matches the claimed Content-Type
  const detectedType = IMAGE_TYPES[dimensions.type];
  if (detectedType !== type) {
    await bucket.delete(image.id);
    await client.media.deleteImage.mutate({ id: image.id, workspaceId });
    throw new UnsupportedMediaTypeError();
  }

  // Step 3: Update database record with pending=false
  try {
    return await client.media.updateImage.mutate({
      id: image.id,
      workspaceId,
      pending: false,
      bytes: object.size,
      width: dimensions.width,
      height: dimensions.height,
    });
  } catch {
    await bucket.delete(image.id);
    await client.media.deleteImage.mutate({ id: image.id, workspaceId });
    throw new InternalServerError("Failed to complete upload");
  }
}
