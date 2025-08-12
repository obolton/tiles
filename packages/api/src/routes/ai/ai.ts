import replicate from "@/utils/replicate.ts";
import { TEXT_TO_IMAGE_MODEL, TEXT_MODEL } from "./constants.ts";
import { streamToBase64String } from "@/utils/streams.ts";
import { parseMarkdown } from "@/utils/markdown.ts";
import type { ServerSentEvent } from "@/utils/replicate.ts";
import type { GenerateImageSchema, WriteSchema } from "./schema.ts";

export async function generateImage({ prompt }: GenerateImageSchema) {
  const result = await replicate.run(TEXT_TO_IMAGE_MODEL, {
    input: {
      prompt,
      go_fast: true,
      num_outputs: 1,
      aspect_ratio: "1:1",
      output_quality: 80,
      output_format: "webp",
    },
  });

  if (!Array.isArray(result) || !(result[0] instanceof ReadableStream)) {
    throw new Error("Invalid response");
  }

  const [output] = result;
  const data = await streamToBase64String(output);

  return {
    type: "image/webp",
    data,
  };
}

async function* getStreamOutput(input: AsyncGenerator<ServerSentEvent>) {
  for await (const message of input) {
    if (message.event === "output") {
      yield message.data;
    }
  }
}

export function write({ prompt, context }: WriteSchema, signal?: AbortSignal) {
  const fullPrompt =
    (context ? `### Context:\n${context}\n\n` : "") + `### Task:\n${prompt}`;
  const stream = replicate.stream(TEXT_MODEL, {
    input: {
      system_prompt: "You are a helpful assistant.",
      prompt: fullPrompt,
    },
    signal,
  });

  return parseMarkdown(getStreamOutput(stream));
}
