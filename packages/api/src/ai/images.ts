import { Buffer } from "node:buffer";
import crypto from "node:crypto";
import { upload, IMAGES_BUCKET } from "@/utils/storage.ts";
import { openai } from "./openai.ts";
import {
  IMAGE_GENERATION_OPTIONS,
  IMAGE_CONTENT_TYPE,
  IMAGE_EXTENSION,
} from "./constants.ts";
import { createImage } from "@/routes/images/images.ts";
import type { ResponseOutputItem } from "openai/resources/responses/responses";
import type { ToolContext } from "./tools.ts";

export async function generateImageFromPrompt(prompt: string) {
  const response = await openai.images.generate({
    ...IMAGE_GENERATION_OPTIONS,
    prompt,
  });

  if (!response.data || response.data.length === 0) {
    throw new Error("Invalid response");
  }

  const [output] = response.data;
  const data = output?.b64_json;

  return {
    type: IMAGE_CONTENT_TYPE,
    data,
  };
}

export async function uploadGeneratedImage(
  call: ResponseOutputItem.ImageGenerationCall,
  context: ToolContext,
) {
  if (
    call.type !== "image_generation_call" ||
    call.status !== "completed" ||
    !call.result
  ) {
    throw new Error("Invalid image generation call result");
  }
  const buffer = Buffer.from(call.result, "base64");
  const imageId = crypto.randomUUID();
  const imageKey = `${context.userId}/${imageId}.${IMAGE_EXTENSION}`;
  await upload(IMAGES_BUCKET, imageKey, buffer, IMAGE_CONTENT_TYPE);
  return imageKey;
}

export async function createImageTile(
  call: ResponseOutputItem.ImageGenerationCall,
  context: ToolContext,
) {
  const imageKey = await uploadGeneratedImage(call, context);
  const { pageId, sectionId } = context;
  const artifact = await createImage({
    pageId,
    sectionId,
    imageKey,
    width: 8,
    height: 8,
  });
  return { artifact };
}
