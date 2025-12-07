import assert from "node:assert";
import { OpenAI } from "openai";
import type { ResponseStreamEvent } from "openai/resources/responses/responses";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
assert(OPENAI_API_KEY, "OPENAI_API_KEY is not defined");

export const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

export function textStream() {
  return new TransformStream<ResponseStreamEvent, string>({
    transform(event, controller) {
      if (event.type === "response.output_text.delta") {
        controller.enqueue(event.delta);
      }
    },
  });
}
