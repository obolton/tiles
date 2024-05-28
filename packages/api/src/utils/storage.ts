import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const CLOUDFLARE_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;
const CLOUDFLARE_ACCESS_KEY_ID = process.env.CLOUDFLARE_ACCESS_KEY_ID;
const CLOUDFLARE_SECRET_ACCESS_KEY = process.env.CLOUDFLARE_SECRET_ACCESS_KEY;
const CLOUDFLARE_R2_BUCKET = process.env.CLOUDFLARE_R2_BUCKET;

if (!CLOUDFLARE_ACCOUNT_ID) {
  throw new Error("CLOUDFLARE_ACCOUNT_ID is required");
}

if (!CLOUDFLARE_ACCESS_KEY_ID) {
  throw new Error("CLOUDFLARE_ACCESS_KEY_ID is required");
}

if (!CLOUDFLARE_SECRET_ACCESS_KEY) {
  throw new Error("CLOUDFLARE_SECRET_ACCESS_KEY is required");
}

if (!CLOUDFLARE_R2_BUCKET) {
  throw new Error("CLOUDFLARE_R2_BUCKET is required");
}

const S3 = new S3Client({
  region: "auto",
  endpoint: `https://${CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: CLOUDFLARE_ACCESS_KEY_ID,
    secretAccessKey: CLOUDFLARE_SECRET_ACCESS_KEY,
  },
});

export async function createSignedUploadUrl(key: string) {
  const command = new PutObjectCommand({
    Bucket: CLOUDFLARE_R2_BUCKET,
    Key: key,
  });
  return getSignedUrl(S3, command, { expiresIn: 180 });
}
