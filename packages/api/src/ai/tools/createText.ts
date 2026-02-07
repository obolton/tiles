import { z } from "zod";
import { createText } from "@/routes/text/text.ts";
import { SizeSchema, getDimensions } from "./schema.ts";
import type { FunctionToolOptions, ToolContext } from "./types.ts";

const CreateTextSchema = z.strictObject({
  sectionId: z.string().nullable().meta({
    description: "Section ID to place this content inside a section, or null",
  }),
  align: z
    .enum(["left", "center", "right"])
    .nullable()
    .meta({ description: "The horizontal alignment of the text." }),
  size: SizeSchema,
});

type CreateTextSchemaType = z.infer<typeof CreateTextSchema>;

function getTextAlignment(value: CreateTextSchemaType["align"]) {
  switch (value) {
    case "left":
      return 0;
    case "center":
      return 1;
    case "right":
      return 2;
    default:
      return 0;
  }
}

async function createTextArtifact(
  args: z.infer<typeof CreateTextSchema>,
  { pageId, sectionId, resolveArtifactId }: ToolContext,
) {
  const { align, size } = args;
  const resolvedSectionId = args.sectionId
    ? resolveArtifactId(args.sectionId)
    : sectionId;
  const artifact = await createText({
    pageId,
    sectionId: resolvedSectionId,
    ...getDimensions(size),
    content: [
      {
        type: "paragraph",
        align: getTextAlignment(align),
        children: [],
      },
    ],
  });
  return { artifact };
}

export const CREATE_TEXT_TOOL: FunctionToolOptions<typeof CreateTextSchema> = {
  name: "create_text",
  description: "Creates a text block to contain a section of text.",
  schema: CreateTextSchema,
  function: createTextArtifact,
};
