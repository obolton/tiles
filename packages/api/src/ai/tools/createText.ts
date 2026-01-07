import { z } from "zod";
import { createText } from "@/routes/text/text.ts";
import { ColorSchema } from "@/schema/Color.ts";
import type { FunctionToolOptions, ToolContext } from "./types.ts";

const CreateTextSchema = z.strictObject({
  sectionId: z.string().nullable().meta({
    description: "Section ID to place this content inside a section, or null",
  }),
  textColor: ColorSchema.nullable().meta({
    description:
      "The text color, or null to use the default text color of the document.",
  }),
  backgroundColor: ColorSchema.nullable().meta({
    description:
      "A background color to apply to the text block, or null for transparent.",
  }),
  align: z
    .enum(["left", "center", "right"])
    .nullable()
    .meta({ description: "The horizontal alignment of the text." }),
  size: z
    .enum(["large", "small"])
    .meta({ description: "The size of the text section." }),
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

interface Dimensions {
  width: number;
  height: number;
}

function getDimensions(size: CreateTextSchemaType["size"]): Dimensions {
  switch (size) {
    case "small":
      return { width: 12, height: 10 };
    case "large":
    default:
      return { width: 24, height: 20 };
  }
}

async function createTextArtifact(
  args: z.infer<typeof CreateTextSchema>,
  { pageId, sectionId, resolveArtifactId }: ToolContext,
) {
  const { textColor, backgroundColor, align, size } = args;
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
    textColor,
    background: backgroundColor
      ? { type: "color", color: backgroundColor }
      : undefined,
  });
  return { artifact };
}

export const CREATE_TEXT_TOOL: FunctionToolOptions<typeof CreateTextSchema> = {
  name: "create_text",
  description:
    "Creates a text block to contain a section of text, with optional styling.",
  schema: CreateTextSchema,
  function: createTextArtifact,
};
