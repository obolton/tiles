import assert from "node:assert";
import { OpenAI } from "openai";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
assert(OPENAI_API_KEY, "OPENAI_API_KEY is not defined");

export const openai = new OpenAI({ apiKey: OPENAI_API_KEY });
