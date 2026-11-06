import type { ImageModel, LanguageModel } from "ai";
import { env } from "@/env";
import { IMAGE_MODEL_ID } from "./constants";

// Providers are imported on demand so that only the API keys in use are required.
export async function createLanguageModel(
  provider: string,
  modelId: string,
): Promise<LanguageModel> {
  switch (provider) {
    case "openai": {
      const { openai } = await import("./providers/openai");
      return openai(modelId);
    }
    case "anthropic": {
      const { anthropic } = await import("./providers/anthropic");
      return anthropic(modelId);
    }
    case "google": {
      const { google } = await import("./providers/google");
      return google(modelId);
    }
    default:
      throw new Error(`Unsupported AI_TEXT_PROVIDER: ${provider}`);
  }
}

export const TEXT_MODEL: LanguageModel = await createLanguageModel(
  env.AI_TEXT_PROVIDER,
  env.AI_TEXT_MODEL,
);

const { openai } = await import("./providers/openai");
export const IMAGE_MODEL: ImageModel = openai.image(IMAGE_MODEL_ID);
