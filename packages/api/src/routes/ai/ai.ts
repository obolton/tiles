import { TEXT_TO_IMAGE_MODEL, TEXT_MODEL } from "./constants.ts";
import { parseMarkdown } from "@/utils/markdown.ts";
import { openai } from "@/utils/openai.ts";
import type { GenerateImageSchema, WriteSchema } from "./schema.ts";
import type { Stream } from "openai/streaming";
import type { ResponseStreamEvent } from "openai/resources/responses/responses";

export async function generateImage({ prompt }: GenerateImageSchema) {
  const response = await openai.images.generate({
    model: TEXT_TO_IMAGE_MODEL,
    output_format: "webp",
    prompt,
  });

  if (!response.data) {
    throw new Error("Invalid response");
  }

  const [output] = response.data;
  const data = output?.b64_json;

  return {
    type: "image/webp",
    data,
  };
}

async function* getStreamOutput(input: Stream<ResponseStreamEvent>) {
  for await (const event of input) {
    if (event.type === "response.output_text.delta") {
      yield event.delta;
    }
  }
}

export async function write(
  { prompt, context }: WriteSchema,
  signal?: AbortSignal,
) {
  const fullPrompt =
    (context ? `### Context:\n${context}\n\n` : "") + `### Task:\n${prompt}`;

  const response = await openai.responses.create(
    {
      model: TEXT_MODEL,
      input: fullPrompt,
      reasoning: { effort: "minimal" },
      stream: true,
    },
    { signal },
  );

  return parseMarkdown(getStreamOutput(response));
}
