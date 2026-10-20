import { afterEach, describe, expect, test, vi } from "vitest";
import { AssertionError } from "node:assert";
import { Buffer } from "node:buffer";
import { IMAGES_BUCKET, PROFILE_IMAGES_BUCKET, objectExists, upload } from "../storage";

const { send, done, createClient, createUpload, S3Client, HeadObjectCommand, Upload } = vi.hoisted(
  () => {
    const send = vi.fn();
    const done = vi.fn();
    const createClient = vi.fn();
    const createUpload = vi.fn();
    return {
      send,
      done,
      createClient,
      createUpload,
      S3Client: class {
        send = send;
        constructor(config: unknown) {
          createClient(config);
        }
      },
      HeadObjectCommand: class {
        constructor(public input: unknown) {}
      },
      Upload: class {
        done = done;
        constructor(options: unknown) {
          createUpload(options);
        }
      },
    };
  },
);

vi.mock("@aws-sdk/client-s3", () => ({ S3Client, HeadObjectCommand }));
vi.mock("@aws-sdk/lib-storage", () => ({ Upload }));

describe("buckets", () => {
  test("exposes the configured bucket names", () => {
    expect(IMAGES_BUCKET).toBe("test");
    expect(PROFILE_IMAGES_BUCKET).toBe("test");
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

describe("objectExists", () => {
  test("returns true when the object exists", async () => {
    send.mockResolvedValueOnce({});

    await expect(objectExists("bucket", "key")).resolves.toBe(true);

    expect(send).toHaveBeenCalledExactlyOnceWith({ input: { Bucket: "bucket", Key: "key" } });
  });

  test("returns false when the object is not found", async () => {
    const error = new Error("Not Found");
    error.name = "NotFound";
    send.mockRejectedValueOnce(error);

    await expect(objectExists("bucket", "key")).resolves.toBe(false);
  });

  test("rethrows other errors", async () => {
    const error = new Error("Access Denied");
    error.name = "AccessDenied";
    send.mockRejectedValueOnce(error);

    await expect(objectExists("bucket", "key")).rejects.toBe(error);
  });
});

describe("module initialization", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  test("creates an S3 client for the R2 endpoint", async () => {
    vi.resetModules();

    await import("@/utils/storage");

    expect(createClient).toHaveBeenCalledExactlyOnceWith({
      region: "auto",
      endpoint: "https://test.r2.cloudflarestorage.com",
      credentials: { accessKeyId: "test", secretAccessKey: "test" },
    });
  });

  test.each([
    "CLOUDFLARE_ACCOUNT_ID",
    "CLOUDFLARE_R2_ACCESS_KEY_ID",
    "CLOUDFLARE_R2_SECRET_ACCESS_KEY",
    "CLOUDFLARE_R2_BUCKET_IMAGES",
    "CLOUDFLARE_R2_BUCKET_PROFILE_IMAGES",
  ])("requires %s when the module loads", async (name) => {
    vi.resetModules();
    vi.stubEnv(name, "");

    await expect(import("@/utils/storage")).rejects.toThrow(AssertionError);
  });
});
