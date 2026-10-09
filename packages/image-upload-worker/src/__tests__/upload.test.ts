import { describe, expect, test, vi, beforeEach } from "vitest";
import { imageDimensionsFromStream } from "image-dimensions";
import { uploadImage } from "../upload";
import { createClient } from "../client";
import { BadRequestError, UnsupportedMediaTypeError } from "../errors";
import type { UploadParams } from "../requests";

vi.mock("../client", () => ({
  createClient: vi.fn(() => ({
    media: {
      createImage: { mutate: vi.fn() },
      updateImage: { mutate: vi.fn() },
      deleteImage: { mutate: vi.fn() },
    },
  })),
}));

vi.mock("image-dimensions", () => ({
  imageDimensionsFromStream: vi.fn(() => Promise.resolve({ width: 800, height: 600, type: "png" })),
}));

const UPLOAD_PARAMS: UploadParams = {
  sessionId: "test-session",
  workspaceId: "ws-123",
  purpose: "CONTENT",
  type: "PNG",
};

const CREATED_IMAGE = {
  id: "img-123",
  workspaceId: "ws-123",
  userId: "user-456",
};

const UPDATED_IMAGE = {
  id: "img-123",
};

const R2_OBJECT = { size: 1024 } as R2Object;

const bucket: R2Bucket = {
  put: vi.fn(),
  delete: vi.fn(),
  head: vi.fn(),
  get: vi.fn(),
  list: vi.fn(),
  createMultipartUpload: vi.fn(),
  resumeMultipartUpload: vi.fn(),
};

function createBody() {
  return new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(new Uint8Array([0]));
      controller.close();
    },
  });
}

describe("uploadImage", () => {
  const client = createClient("test-session");
  const createImageMock = vi.mocked(client.media.createImage.mutate);
  const updateImageMock = vi.mocked(client.media.updateImage.mutate);
  const deleteImageMock = vi.mocked(client.media.deleteImage.mutate);

  beforeEach(() => {
    vi.clearAllMocks();

    createImageMock.mockResolvedValue(CREATED_IMAGE);
    updateImageMock.mockResolvedValue(UPDATED_IMAGE);
    vi.mocked(bucket.put).mockResolvedValue(R2_OBJECT);
  });

  test("throws BadRequestError when body is null", async () => {
    await expect(uploadImage(UPLOAD_PARAMS, null, client, bucket)).rejects.toThrow(BadRequestError);
  });

  test("creates image record with correct parameters", async () => {
    await uploadImage(UPLOAD_PARAMS, createBody(), client, bucket);

    expect(createImageMock).toHaveBeenCalledWith({
      workspaceId: "ws-123",
      source: "UPLOAD",
      purpose: "CONTENT",
      type: "PNG",
      pending: true,
    });
  });

  test("uploads to R2 with correct key and metadata", async () => {
    await uploadImage(UPLOAD_PARAMS, createBody(), client, bucket);

    expect(bucket.put).toHaveBeenCalledWith("img-123", expect.any(ReadableStream), {
      httpMetadata: { contentType: "image/png" },
      customMetadata: {
        workspace: "ws-123",
        user: "user-456",
      },
    });
  });

  test("updates image record with file size and dimensions", async () => {
    await uploadImage(UPLOAD_PARAMS, createBody(), client, bucket);

    expect(updateImageMock).toHaveBeenCalledWith({
      id: "img-123",
      workspaceId: "ws-123",
      pending: false,
      bytes: 1024,
      width: 800,
      height: 600,
    });
  });

  test("returns upload result", async () => {
    const result = await uploadImage(UPLOAD_PARAMS, createBody(), client, bucket);

    expect(result).toEqual({ id: "img-123", width: 800, height: 600 });
  });

  test("rolls back and throws BadRequestError when dimensions cannot be read", async () => {
    vi.mocked(imageDimensionsFromStream).mockResolvedValueOnce(undefined);

    await expect(uploadImage(UPLOAD_PARAMS, createBody(), client, bucket)).rejects.toThrow(
      BadRequestError,
    );

    expect(bucket.delete).toHaveBeenCalledWith("img-123");
    expect(deleteImageMock).toHaveBeenCalledWith({
      id: "img-123",
      workspaceId: "ws-123",
    });
  });

  test("rolls back and throws UnsupportedMediaTypeError when detected type does not match Content-Type", async () => {
    vi.mocked(imageDimensionsFromStream).mockResolvedValueOnce({
      width: 800,
      height: 600,
      type: "jpeg",
    });

    await expect(uploadImage(UPLOAD_PARAMS, createBody(), client, bucket)).rejects.toThrow(
      UnsupportedMediaTypeError,
    );

    expect(bucket.delete).toHaveBeenCalledWith("img-123");
    expect(deleteImageMock).toHaveBeenCalledWith({
      id: "img-123",
      workspaceId: "ws-123",
    });
  });

  describe("rollback on R2 upload failure", () => {
    beforeEach(() => {
      vi.mocked(bucket.put).mockRejectedValue(new Error("R2 error"));
    });

    test("deletes the database record but not the R2 object", async () => {
      await expect(uploadImage(UPLOAD_PARAMS, createBody(), client, bucket)).rejects.toThrow(
        "R2 error",
      );

      expect(bucket.delete).not.toHaveBeenCalled();
      expect(deleteImageMock).toHaveBeenCalledWith({
        id: "img-123",
        workspaceId: "ws-123",
      });
    });
  });

  describe("rollback on database update failure", () => {
    beforeEach(() => {
      updateImageMock.mockRejectedValue(new Error("Database error"));
    });

    test("deletes the R2 object and database record", async () => {
      await expect(uploadImage(UPLOAD_PARAMS, createBody(), client, bucket)).rejects.toThrow(
        "Database error",
      );

      expect(bucket.delete).toHaveBeenCalledWith("img-123");
      expect(deleteImageMock).toHaveBeenCalledWith({
        id: "img-123",
        workspaceId: "ws-123",
      });
    });
  });
});
