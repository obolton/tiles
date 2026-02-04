import type { Client } from "./client";
import type { UploadParams } from "./requests";
import { BadRequestError, InternalServerError } from "./errors";

export interface UploadResult {
  id: string;
}

/**
 * Uploads and image to R2 and creates a database record.
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

  // Step 2: Upload to R2
  let object: R2Object;
  try {
    object = await bucket.put(image.id, body, {
      customMetadata: {
        workspace: image.workspaceId,
        user: image.userId,
      },
    });
  } catch {
    await client.media.deleteImage.mutate({ id: image.id, workspaceId });
    throw new InternalServerError("Failed to upload file");
  }

  // Step 3: Update database record with pending=false
  try {
    return await client.media.updateImage.mutate({
      id: image.id,
      workspaceId,
      pending: false,
      bytes: object.size,
    });
  } catch {
    await bucket.delete(image.id);
    await client.media.deleteImage.mutate({ id: image.id, workspaceId });
    throw new InternalServerError("Failed to complete upload");
  }
}
