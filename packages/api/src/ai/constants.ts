import type { ResponsesModel, ImageGenerateParams } from "openai/resources";

export const TEXT_MODEL: ResponsesModel = "gpt-5-mini";

export const IMAGE_GENERATION_OPTIONS = {
  model: "gpt-image-1",
  output_format: "webp",
  quality: "low",
  size: "1024x1024",
} satisfies Omit<ImageGenerateParams, "prompt">;
export const IMAGE_CONTENT_TYPE = "image/webp";
export const IMAGE_EXTENSION = "webp";
