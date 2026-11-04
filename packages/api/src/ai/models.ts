import assert from "node:assert";
import type { ImageModel, LanguageModel } from "ai";
import { DEFAULT_TEXT_MODEL, IMAGE_MODEL_ID } from "./constants";
import { openai } from "./providers/openai";

/**
 * Creates the language model for `spec` ("<provider>:<model id>", e.g.
 * "openai:gpt-5.2"). Optional providers are imported on demand so that only
 * the selected provider's API key is required.
 */
export async function createLanguageModel(spec: string): Promise<LanguageModel> {
  const [provider, ...rest] = spec.split(":");
  const modelId = rest.join(":");
  assert(modelId, `Invalid AI_TEXT_MODEL: ${spec}`);
  switch (provider) {
    case "openai":
      return openai(modelId);
    case "anthropic": {
      const { anthropic } = await import("./providers/anthropic");
      return anthropic(modelId);
    }
    case "google": {
      const { google } = await import("./providers/google");
      return google(modelId);
    }
    default:
      throw new Error(`Unsupported AI_TEXT_MODEL provider: ${spec}`);
  }
}

export const TEXT_MODEL: LanguageModel = await createLanguageModel(
  process.env.AI_TEXT_MODEL ?? DEFAULT_TEXT_MODEL,
);
export const IMAGE_MODEL: ImageModel = openai.image(IMAGE_MODEL_ID);
