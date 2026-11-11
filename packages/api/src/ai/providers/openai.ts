// oxlint-disable node/no-process-env
import { createOpenAI } from "@ai-sdk/openai";
import { defineEnv } from "env";

const env = defineEnv({ OPENAI_API_KEY: process.env.OPENAI_API_KEY });

export const openai = createOpenAI({ apiKey: env.OPENAI_API_KEY });
