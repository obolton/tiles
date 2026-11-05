import { createAnthropic } from "@ai-sdk/anthropic";
import { anthropicEnv } from "@/env";

export const anthropic = createAnthropic({ apiKey: anthropicEnv.ANTHROPIC_API_KEY });
