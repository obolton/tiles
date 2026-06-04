import type { ResponsesModel, ImageGenerateParams } from "openai/resources";
import type { ImageType } from "@/generated/prisma/enums";

export const TEXT_MODEL: ResponsesModel = "gpt-5.2";

export const IMAGE_GENERATION_DIMENSIONS = {
  width: 1024,
  height: 1024,
} as const;

export const IMAGE_GENERATION_OPTIONS = {
  model: "gpt-image-1.5",
  output_format: "webp",
  quality: "low",
  size: `${IMAGE_GENERATION_DIMENSIONS.width}x${IMAGE_GENERATION_DIMENSIONS.height}`,
} satisfies Omit<ImageGenerateParams, "prompt">;
export const IMAGE_CONTENT_TYPE = "image/webp";
export const IMAGE_TYPE: ImageType = "WEBP";
