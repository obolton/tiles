// oxlint-disable node/no-process-env
import { createAnthropic } from "@ai-sdk/anthropic";
import { defineEnv } from "env";

const env = defineEnv({ ANTHROPIC_PLATFORM_API_KEY: process.env.ANTHROPIC_PLATFORM_API_KEY });

export const anthropic = createAnthropic({ apiKey: env.ANTHROPIC_PLATFORM_API_KEY });
