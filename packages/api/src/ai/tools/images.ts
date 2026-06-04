import { Buffer } from "node:buffer";
import prisma from "@/database/prisma.ts";
import { upload, IMAGES_BUCKET } from "@/utils/storage.ts";
import { openai } from "../openai.ts";
import {
  IMAGE_GENERATION_OPTIONS,
  IMAGE_GENERATION_DIMENSIONS,
  IMAGE_CONTENT_TYPE,
  IMAGE_TYPE,
} from "../constants.ts";
import { buildImageMap } from "doc/tiles/image";
import type {
  ResponseOutputItem,
  Tool,
} from "openai/resources/responses/responses";
import type { ToolContext } from "./types.ts";

interface CreateImageRecordInput {
  id: string;
  bytes: number;
  userId: string;
  workspaceId: string;
}

async function createImageRecord({
  id,
  bytes,
  userId,
  workspaceId,
}: CreateImageRecordInput) {
  await prisma.image.create({
    data: {
      id,
      workspaceId,
      userId,
      source: "GENERATED",
      purpose: "CONTENT",
      type: IMAGE_TYPE,
      bytes,
    },
    select: {
      id: true,
    },
  });
}

export const IMAGE_GENERATION_TOOL = {
  type: "image_generation",
  ...IMAGE_GENERATION_OPTIONS,
} satisfies Tool;

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
  { userId, workspaceId }: ToolContext,
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
  await upload(IMAGES_BUCKET, imageId, buffer, IMAGE_CONTENT_TYPE);
  await createImageRecord({
    id: imageId,
    userId,
    workspaceId,
    bytes: buffer.length,
  });
  return imageId;
}

export async function createImageTile(
  call: ResponseOutputItem.ImageGenerationCall,
  context: ToolContext,
) {
  const { sectionId, session } = context;
  const imageId = await uploadGeneratedImage(call, context);
  const map = buildImageMap({
    imageId,
    size: IMAGE_GENERATION_DIMENSIONS,
    width: 12,
    height: 12,
  });
  const tileId = session.createTile(map, { parentId: sectionId });
  return { tileId };
}
