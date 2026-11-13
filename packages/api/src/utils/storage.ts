import { S3Client } from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";
import { env } from "@/env";

export const IMAGES_BUCKET = env.CLOUDFLARE_R2_BUCKET_IMAGES;

const S3 = new S3Client({
  region: "auto",
  endpoint: `https://${env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: env.CLOUDFLARE_R2_ACCESS_KEY_ID,
    secretAccessKey: env.CLOUDFLARE_R2_SECRET_ACCESS_KEY,
  },
});

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
