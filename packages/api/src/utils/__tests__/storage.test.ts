import { describe, expect, test, vi } from "vitest";
import { Buffer } from "node:buffer";
import { IMAGES_BUCKET, upload } from "../storage";

const { done, clients, createUpload, S3Client, Upload } = vi.hoisted(() => {
  const done = vi.fn();
  const clients: unknown[] = [];
  const createUpload = vi.fn();
  return {
    done,
    clients,
    createUpload,
    S3Client: class {
      constructor(config: unknown) {
        clients.push(config);
      }
    },
    Upload: class {
      done = done;
      constructor(options: unknown) {
        createUpload(options);
      }
    },
  };
});

vi.mock("@aws-sdk/client-s3", () => ({ S3Client }));
vi.mock("@aws-sdk/lib-storage", () => ({ Upload }));

describe("buckets", () => {
  test("exposes the configured images bucket name", () => {
    expect(IMAGES_BUCKET).toBe("test");
  });
});

describe("upload", () => {
  test("uploads the body to the bucket and resolves with the result", async () => {
    const result = { Bucket: "bucket", Key: "key" };
    done.mockResolvedValueOnce(result);
    const body = Buffer.from("image-bytes");

    await expect(upload("bucket", "key", body, "image/png", "max-age=3600")).resolves.toBe(result);

    expect(createUpload).toHaveBeenCalledExactlyOnceWith({
      client: expect.any(S3Client),
      params: {
        Bucket: "bucket",
        Key: "key",
        Body: body,
        ContentType: "image/png",
        CacheControl: "max-age=3600",
      },
      queueSize: 4,
      leavePartsOnError: false,
    });
    expect(done).toHaveBeenCalledTimes(1);
  });

  test("omits the cache control header by default", async () => {
    await upload("bucket", "key", Buffer.from(""), "image/png");

    expect(createUpload).toHaveBeenCalledExactlyOnceWith(
      expect.objectContaining({
        params: expect.objectContaining({ CacheControl: undefined }),
      }),
    );
  });

  test("supports streamed bodies", async () => {
    const body = new ReadableStream();

    await upload("bucket", "key", body, "image/jpeg");

    expect(createUpload).toHaveBeenCalledExactlyOnceWith(
      expect.objectContaining({ params: expect.objectContaining({ Body: body }) }),
    );
  });

  test("propagates upload failures", async () => {
    done.mockRejectedValueOnce(new Error("Upload failed"));

    await expect(upload("bucket", "key", Buffer.from(""), "image/png")).rejects.toThrow(
      "Upload failed",
    );
  });
});

describe("module initialization", () => {
  test("creates a single S3 client for the R2 endpoint", () => {
    expect(clients).toEqual([
      {
        region: "auto",
        endpoint: "https://test.r2.cloudflarestorage.com",
        credentials: { accessKeyId: "test", secretAccessKey: "test" },
      },
    ]);
  });
});
