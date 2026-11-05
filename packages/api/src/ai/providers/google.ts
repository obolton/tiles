import assert from "node:assert";
import { createGoogle } from "@ai-sdk/google";

const GOOGLE_GENERATIVE_AI_API_KEY = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
assert(GOOGLE_GENERATIVE_AI_API_KEY, "GOOGLE_GENERATIVE_AI_API_KEY is not defined");

export const google = createGoogle({ apiKey: GOOGLE_GENERATIVE_AI_API_KEY });
