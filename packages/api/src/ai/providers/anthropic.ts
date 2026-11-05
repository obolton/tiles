import assert from "node:assert";
import { createAnthropic } from "@ai-sdk/anthropic";

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
assert(ANTHROPIC_API_KEY, "ANTHROPIC_API_KEY is not defined");

export const anthropic = createAnthropic({ apiKey: ANTHROPIC_API_KEY });
