import { Buffer } from "node:buffer";
import { beforeEach, describe, expect, test, vi } from "vitest";
import prisma from "@/database/prisma";
import { upload } from "@/utils/storage";
import { openai } from "@/ai/openai";
import { MOCK_TOOL_CONTEXT } from "@/test/fixtures/ai";
import { generateAndUploadImage, generateImageFromPrompt } from "../images";

vi.mock("@/ai/openai.ts", () => ({
  openai: { images: { generate: vi.fn() } },
}));

vi.mock("@/utils/storage.ts", () => ({
  upload: vi.fn(),
  IMAGES_BUCKET: "images-bucket",
}));

const IMAGE_DATA = Buffer.from("image-bytes").toString("base64");

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(openai.images.generate).mockResolvedValue({
    created: 0,
    data: [{ b64_json: IMAGE_DATA }],
  });
});

describe("generateImageFromPrompt", () => {
  test("returns the generated image data for the prompt", async () => {
    const result = await generateImageFromPrompt("a red circle");

    expect(openai.images.generate).toHaveBeenCalledWith(
      expect.objectContaining({ prompt: "a red circle" }),
    );
    expect(result).toEqual({ type: "image/webp", data: IMAGE_DATA });
  });

  test("throws when no image is returned", async () => {
    vi.mocked(openai.images.generate).mockResolvedValue({
      created: 0,
      data: [],
    });

    await expect(generateImageFromPrompt("a red circle")).rejects.toThrow(
      "Image generation returned no data",
    );
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
