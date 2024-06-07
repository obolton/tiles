import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { Upload } from "@aws-sdk/lib-storage";

const CLOUDFLARE_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;
const CLOUDFLARE_R2_ACCESS_KEY_ID = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID;
const CLOUDFLARE_R2_SECRET_ACCESS_KEY =
  process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY;
const CLOUDFLARE_R2_BUCKET_IMAGES = process.env.CLOUDFLARE_R2_BUCKET_IMAGES;

if (!CLOUDFLARE_ACCOUNT_ID) {
  throw new Error("CLOUDFLARE_ACCOUNT_ID is required");
}

if (!CLOUDFLARE_R2_ACCESS_KEY_ID) {
  throw new Error("CLOUDFLARE_R2_ACCESS_KEY_ID is required");
}

if (!CLOUDFLARE_R2_SECRET_ACCESS_KEY) {
  throw new Error("CLOUDFLARE_R2_SECRET_ACCESS_KEY is required");
}

if (!CLOUDFLARE_R2_BUCKET_IMAGES) {
  throw new Error("CLOUDFLARE_R2_BUCKET is required");
}

const S3 = new S3Client({
  region: "auto",
  endpoint: `https://${CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: CLOUDFLARE_R2_ACCESS_KEY_ID,
    secretAccessKey: CLOUDFLARE_R2_SECRET_ACCESS_KEY,
  },
});

export async function createSignedUploadUrl(key: string) {
  const command = new PutObjectCommand({
    Bucket: CLOUDFLARE_R2_BUCKET_IMAGES,
    Key: key,
  });
  return getSignedUrl(S3, command, { expiresIn: 180 });
}

export async function upload(
  bucket: string,
  key: string,
  body: ReadableStream,
  contentType: string
) {
  const upload = new Upload({
    client: S3,
    params: {
      Bucket: bucket,
      Key: key,
      // @ts-expect-error The type definition for Body does not currently recognize Node.js ReadableStream, although it is supported
      Body: body,
      ContentType: contentType,
    },
    queueSize: 4,
    leavePartsOnError: false,
  });
  return upload.done();
}
