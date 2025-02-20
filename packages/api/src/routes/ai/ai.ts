import replicate from "@/utils/replicate.ts";
import { TEXT_TO_IMAGE_MODEL } from "./constants.ts";
import type { GenerateImageSchema } from "./schema.ts";
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
