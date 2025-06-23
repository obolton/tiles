import replicate from "@/utils/replicate.ts";
import { TEXT_TO_IMAGE_MODEL, TEXT_MODEL } from "./constants.ts";
import type { GenerateImageSchema, WriteSchema } from "./schema.ts";
import { streamToBase64String } from "@/utils/streams.ts";

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

export async function* write({ prompt }: WriteSchema, signal?: AbortSignal) {
  const stream = replicate.stream(TEXT_MODEL, {
    input: {
      system_prompt: "You are a helpful assistant.",
      prompt,
    },
    signal,
  });

  for await (const message of stream) {
    if (message.event === "output") {
      yield message.data;
    }
  }
}
