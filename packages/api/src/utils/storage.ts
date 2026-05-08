import assert from "node:assert";
import {
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { Upload } from "@aws-sdk/lib-storage";

type MediaType = "image" | "profile-image";

const CLOUDFLARE_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;
const CLOUDFLARE_R2_ACCESS_KEY_ID = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID;
const CLOUDFLARE_R2_SECRET_ACCESS_KEY =
  process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY;
export const IMAGES_BUCKET = process.env.CLOUDFLARE_R2_BUCKET_IMAGES ?? "";
export const PROFILE_IMAGES_BUCKET =
  process.env.CLOUDFLARE_R2_BUCKET_PROFILE_IMAGES ?? "";
export const FONTS_BUCKET = process.env.CLOUDFLARE_R2_BUCKET_FONTS ?? "";

assert(CLOUDFLARE_ACCOUNT_ID);
assert(CLOUDFLARE_R2_ACCESS_KEY_ID);
assert(CLOUDFLARE_R2_SECRET_ACCESS_KEY);
assert(IMAGES_BUCKET);
assert(PROFILE_IMAGES_BUCKET);
assert(FONTS_BUCKET);

const S3 = new S3Client({
  region: "auto",
  endpoint: `https://${CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: CLOUDFLARE_R2_ACCESS_KEY_ID,
    secretAccessKey: CLOUDFLARE_R2_SECRET_ACCESS_KEY,
  },
});

function getBucket(mediaType: MediaType) {
  switch (mediaType) {
    case "image":
      return IMAGES_BUCKET;
    case "profile-image":
      return PROFILE_IMAGES_BUCKET;
    default:
      throw new Error("Invalid media type:", mediaType);
  }
}

export async function createSignedUploadUrl(
  key: string,
  type: MediaType,
  metadata: { workspaceId: string; userId: string },
) {
  const { workspaceId, userId } = metadata;
  const bucket = getBucket(type);
  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Metadata: {
      workspace: workspaceId,
      user: userId,
    },
  });
  return getSignedUrl(S3, command, {
    expiresIn: 180,
    unhoistableHeaders: new Set(["x-amz-meta-workspace", "x-amz-meta-user"]),
  });
}

export async function upload(
  bucket: string,
  key: string,
  body: ReadableStream | Buffer,
  contentType: string,
  cacheControl?: string,
) {
  const upload = new Upload({
    client: S3,
    params: {
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: contentType,
      CacheControl: cacheControl,
    },
    queueSize: 4,
    leavePartsOnError: false,
  });
  return upload.done();
}

export async function objectExists(bucket: string, key: string) {
  try {
    await S3.send(new HeadObjectCommand({ Bucket: bucket, Key: key }));
    return true;
  } catch (error) {
    if (error instanceof Error && error.name === "NotFound") {
      return false;
    }
    throw error;
  }
}
