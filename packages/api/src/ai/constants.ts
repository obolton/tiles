import type {
  OpenAIImageModelGenerationOptions,
  OpenAILanguageModelResponsesOptions,
} from "@ai-sdk/openai";
import type { ImageType } from "@/generated/prisma/enums";

export const DEFAULT_TEXT_PROVIDER = "openai";
export const DEFAULT_TEXT_MODEL = "gpt-5.2";

export const TEXT_PROVIDER_OPTIONS = {
  // Reasoning summaries are unused; they would otherwise default on once an effort is set.
  openai: { reasoningSummary: null } satisfies OpenAILanguageModelResponsesOptions,
};

export const IMAGE_MODEL_ID = "gpt-image-1.5";

export const IMAGE_GENERATION_DIMENSIONS = {
  width: 1024,
  height: 1024,
} as const;

export const IMAGE_GENERATION_OPTIONS = {
  quality: "low",
  outputFormat: "webp",
} satisfies OpenAIImageModelGenerationOptions;
export const IMAGE_CONTENT_TYPE = "image/webp";
export const IMAGE_TYPE: ImageType = "WEBP";
