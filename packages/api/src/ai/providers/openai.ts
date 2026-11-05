import assert from "node:assert";
import { createOpenAI } from "@ai-sdk/openai";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
assert(OPENAI_API_KEY, "OPENAI_API_KEY is not defined");

export const openai = createOpenAI({ apiKey: OPENAI_API_KEY });
