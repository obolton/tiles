import assert from "node:assert";
import { createAnthropic } from "@ai-sdk/anthropic";
import { createGoogle } from "@ai-sdk/google";
import { createOpenAI } from "@ai-sdk/openai";
import type { ImageModel, LanguageModel } from "ai";
import { DEFAULT_TEXT_MODEL, IMAGE_MODEL_ID } from "./constants";

function requireEnv(name: string): string {
  const value = process.env[name];
  assert(value, `${name} is not defined`);
  return value;
}

const openai = createOpenAI({ apiKey: requireEnv("OPENAI_API_KEY") });

// `AI_TEXT_MODEL` is "<provider>:<model id>", e.g. "openai:gpt-5.2" or "anthropic:claude-sonnet-4-5".
function createLanguageModel(spec: string): LanguageModel {
  const [provider, ...rest] = spec.split(":");
  const modelId = rest.join(":");
  switch (provider) {
    case "openai":
      return openai(modelId);
    case "anthropic":
      return createAnthropic({ apiKey: requireEnv("ANTHROPIC_API_KEY") })(modelId);
    case "google":
      return createGoogle({ apiKey: requireEnv("GOOGLE_GENERATIVE_AI_API_KEY") })(modelId);
    default:
      throw new Error(`Unsupported AI_TEXT_MODEL: ${spec}`);
  }
}

export const TEXT_MODEL: LanguageModel = createLanguageModel(
  process.env.AI_TEXT_MODEL ?? DEFAULT_TEXT_MODEL,
);
export const IMAGE_MODEL: ImageModel = openai.image(IMAGE_MODEL_ID);
