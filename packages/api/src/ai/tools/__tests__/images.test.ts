import { Buffer } from "node:buffer";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { NoImageGeneratedError } from "ai";
import prisma from "@/database/prisma";
import { upload } from "@/utils/storage";
import { MOCK_TOOL_CONTEXT } from "@/test/fixtures/ai";
import { generateAndUploadImage, generateImageFromPrompt } from "../images";

const { doGenerate } = vi.hoisted(() => ({ doGenerate: vi.fn() }));

vi.mock("@/ai/models", async () => {
  const { MockImageModelV4 } = await import("ai/test");
  const model = new MockImageModelV4({ doGenerate });
  return { getImageModel: async () => model };
});

vi.mock("@/utils/storage", () => ({
  upload: vi.fn(),
  IMAGES_BUCKET: "images-bucket",
}));

const IMAGE_DATA = Buffer.from("image-bytes").toString("base64");

function imageResult(images: string[]) {
  return {
    images,
    isRetryable: false,
    warnings: [],
    response: { timestamp: new Date(0), modelId: "test-image-model", headers: undefined },
  };
}

beforeEach(() => {
  doGenerate.mockResolvedValue(imageResult([IMAGE_DATA]));
});

describe("generateImageFromPrompt", () => {
  test("returns the generated image data for the prompt", async () => {
    const result = await generateImageFromPrompt("a red circle");

    expect(doGenerate).toHaveBeenCalledWith(
      expect.objectContaining({
        prompt: "a red circle",
        size: "1024x1024",
        providerOptions: { openai: { quality: "low", outputFormat: "webp" } },
      }),
    );
    expect(result).toEqual({ type: "image/webp", data: IMAGE_DATA });
  });

  test("throws when no image is returned", async () => {
    doGenerate.mockResolvedValue(imageResult([]));

    await expect(generateImageFromPrompt("a red circle")).rejects.toThrow(NoImageGeneratedError);
  });
});

describe("generateAndUploadImage", () => {
  test("uploads the generated image, records it, and returns the id", async () => {
    const imageId = await generateAndUploadImage("a red circle", MOCK_TOOL_CONTEXT);

    expect(imageId).toBeTypeOf("string");
    expect(upload).toHaveBeenCalledWith("images-bucket", imageId, expect.any(Buffer), "image/webp");
    expect(prisma.image.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          id: imageId,
          userId: "test-user",
          workspaceId: "test-workspace",
          source: "GENERATED",
          purpose: "CONTENT",
          type: "WEBP",
          bytes: expect.any(Number),
        }),
      }),
    );
  });
});
