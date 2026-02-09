import { z } from "zod";
import { Layout } from "@/generated/prisma/enums";
import { createSection } from "@/routes/sections/sections.ts";
import { SizeSchema, getDimensions } from "./schema.ts";
import type { FunctionToolOptions, ToolContext } from "./types.ts";

const CreateSectionSchema = z.strictObject({
  size: SizeSchema,
  layout: z.enum(Layout).meta({
    description:
      "Layout type: GRID (default), HORIZONTAL (side-by-side scrollable), VERTICAL (stacked), or FREEFORM (free positioning)",
  }),
});

async function createSectionArtifact(
  args: z.infer<typeof CreateSectionSchema>,
  { pageId }: ToolContext,
) {
  const { size, layout } = args;

  const artifact = await createSection({
    pageId,
    layout,
    ...getDimensions(size),
  });

  return { artifact };
}

export const CREATE_SECTION_TOOL: FunctionToolOptions<
  typeof CreateSectionSchema
> = {
  name: "create_section",
  description:
    "Creates a section container for grouping related content. After creating a section, use its ID as the sectionId parameter in other tools to add content inside it.",
  schema: CreateSectionSchema,
  function: createSectionArtifact,
};
