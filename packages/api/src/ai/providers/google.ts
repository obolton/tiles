// oxlint-disable node/no-process-env
import { createGoogle } from "@ai-sdk/google";
import { defineEnv } from "env";

const env = defineEnv({ GOOGLE_PLATFORM_API_KEY: process.env.GOOGLE_PLATFORM_API_KEY });

export const google = createGoogle({ apiKey: env.GOOGLE_PLATFORM_API_KEY });
