import { Buffer } from "node:buffer";
import { generateImage } from "ai";
import prisma from "@/database/prisma";
import { upload, IMAGES_BUCKET } from "@/utils/storage";
import { IMAGE_MODEL } from "../models";
import {
  IMAGE_GENERATION_OPTIONS,
  IMAGE_GENERATION_SIZE,
  IMAGE_CONTENT_TYPE,
  IMAGE_TYPE,
} from "../constants";
import type { ToolContext } from "./types";

export async function generateImageFromPrompt(prompt: string) {
  const { image } = await generateImage({
    model: IMAGE_MODEL,
    prompt,
    size: IMAGE_GENERATION_SIZE,
    providerOptions: { openai: IMAGE_GENERATION_OPTIONS },
  });

  return {
    type: IMAGE_CONTENT_TYPE,
    data: image.base64,
  };
}

/**
 * Generates an image from `prompt`, uploads it to object storage, records it,
 * and returns the new image id.
 */
export async function generateAndUploadImage(
  prompt: string,
  { userId, workspaceId }: ToolContext,
): Promise<string> {
  const { data } = await generateImageFromPrompt(prompt);
  const buffer = Buffer.from(data, "base64");
  const imageId = crypto.randomUUID();
  await upload(IMAGES_BUCKET, imageId, buffer, IMAGE_CONTENT_TYPE);
  await prisma.image.create({
    data: {
      id: imageId,
      workspaceId,
      userId,
      source: "GENERATED",
      purpose: "CONTENT",
      type: IMAGE_TYPE,
      bytes: buffer.length,
    },
    select: { id: true },
  });
  return imageId;
}
