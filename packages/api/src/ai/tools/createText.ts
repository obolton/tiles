import { z } from "zod";
import { createText } from "@/routes/text/text.ts";
import { ColorSchema } from "@/schema/Color.ts";
import type { FunctionToolOptions, ToolContext } from "./types.ts";

const CreateTextSchema = z.strictObject({
  text: z.string().meta({
    description: "The text to add to the text block. Markdown may be used.",
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
});

function getTextAlignment(value: "left" | "center" | "right" | null) {
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
  { pageId, sectionId }: ToolContext,
) {
  const { text, textColor, backgroundColor, align } = args;
  const artifact = await createText({
    pageId,
    sectionId,
    width: 10,
    height: 10,
    content: [
      {
        type: "paragraph",
        align: getTextAlignment(align),
        children: [
          {
            type: "text",
            text: text,
            format: 0,
          },
        ],
      },
    ],
    textColor,
    background: backgroundColor ? { color: backgroundColor } : undefined,
  });
  return { artifact };
}

export const CREATE_TEXT_TOOL: FunctionToolOptions<typeof CreateTextSchema> = {
  name: "create_text",
  description:
    "Creates a text block for a section of text, with optional styling.",
  schema: CreateTextSchema,
  function: createTextArtifact,
};
